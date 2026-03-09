import {
	CheckIcon,
	DatabaseIcon,
	FileSpreadsheetIcon,
	SearchIcon,
	UploadIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Separator,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { DB_TYPE_TO_WIDGET } from "../form-builder.constants";
import type {
	FieldConfig,
	FormBuilderState,
	TableConfig,
} from "../form-builder.types";

interface Engine {
	app_id: string;
	app_name: string;
	app_type: string;
	description?: string;
}

interface FormBuilderDatabaseStepProps {
	state: FormBuilderState;
	onUpdate: (updates: Partial<FormBuilderState>) => void;
}

const ACCEPTED_EXTENSIONS = ".csv,.tsv,.xlsx,.xls";

export const FormBuilderDatabaseStep = ({
	state,
	onUpdate,
}: FormBuilderDatabaseStepProps) => {
	const { monolithStore, configStore } = useRootStore();
	const [search, setSearch] = useState("");
	const [engines, setEngines] = useState<Engine[]>([]);
	const [isLoadingEngines, setIsLoadingEngines] = useState(false);
	const [isLoadingStructure, setIsLoadingStructure] = useState(false);
	const [tables, setTables] = useState<
		{ table: string; columns: { column: string; type: string }[] }[]
	>([]);
	const [selectedTables, setSelectedTables] = useState<string[]>(
		state.tables.map((t) => t.table),
	);

	// -- Create-new state --
	const [uploadFile_, setUploadFile] = useState<File | null>(null);
	const [isCreatingDb, setIsCreatingDb] = useState(false);
	const [createError, setCreateError] = useState("");
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load database engines
	const loadEngines = useCallback(async () => {
		setIsLoadingEngines(true);
		try {
			const pixel = `MyEngines(${search ? `filterWord=["${search}"], ` : ""}engineTypes=["DATABASE"], limit=[50], offset=[0]);`;
			const response = await monolithStore.runQuery(pixel);
			const output = response.pixelReturn?.[0]?.output;
			if (Array.isArray(output)) {
				setEngines(output as Engine[]);
			}
		} catch {
			setEngines([]);
		} finally {
			setIsLoadingEngines(false);
		}
	}, [monolithStore, search]);

	useEffect(() => {
		loadEngines();
	}, [loadEngines]);

	// Load table structure for selected database
	const loadStructure = useCallback(
		async (engineId: string) => {
			setIsLoadingStructure(true);
			try {
				const pixel = `META|GetDatabaseTableStructure(database=["${engineId}"]);`;
				const response = await monolithStore.runQuery(pixel);
				const rows = response.pixelReturn?.[0]?.output;

				if (!Array.isArray(rows)) {
					throw new Error("Invalid response");
				}

				const tableMap = new Map<
					string,
					{ column: string; type: string }[]
				>();
				for (const row of rows) {
					if (!Array.isArray(row) || row.length < 3) continue;
					const tableName = String(row[5] ?? row[0] ?? "");
					const columnName = String(row[4] ?? row[1] ?? "");
					const columnType = String(row[2] ?? "UNKNOWN");
					if (!tableName || !columnName) continue;

					const columns = tableMap.get(tableName) || [];
					columns.push({ column: columnName, type: columnType });
					tableMap.set(tableName, columns);
				}

				const result = Array.from(tableMap.entries()).map(
					([table, columns]) => ({ table, columns }),
				);
				setTables(result);
				// Auto-select all tables
				setSelectedTables(result.map((t) => t.table));
			} catch {
				setTables([]);
				setSelectedTables([]);
			} finally {
				setIsLoadingStructure(false);
			}
		},
		[monolithStore],
	);

	const selectEngine = (engine: Engine) => {
		onUpdate({
			databaseId: engine.app_id,
			databaseName: engine.app_name,
			tables: [],
		});
		setSelectedTables([]);
		loadStructure(engine.app_id);
	};

	const toggleTable = (tableName: string) => {
		setSelectedTables((prev) =>
			prev.includes(tableName)
				? prev.filter((t) => t !== tableName)
				: [...prev, tableName],
		);
	};

	// -- Create new database from file --
	const handleCreateDatabase = useCallback(async () => {
		if (!uploadFile_) return;
		setIsCreatingDb(true);
		setCreateError("");
		try {
			// 1. Upload the file to the server
			const uploaded = await uploadFile(
				[uploadFile_],
				configStore.store.insightID,
			);
			if (!uploaded || uploaded.length === 0) {
				throw new Error("File upload failed");
			}

			// 2. Create the database via UploadDatabase
			const pixel = `UploadDatabase(filePath=["${uploaded[0].fileLocation}"], space=[""])`;
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];

			if (operationType.toString().includes("ERROR")) {
				throw new Error(
					(output as string) || "Failed to create database",
				);
			}

			const dbId = (output as Record<string, string>).database_id;
			if (!dbId) throw new Error("No database ID returned");

			// 3. Refresh engines list and auto-select the new one
			await loadEngines();
			const dbName =
				(output as Record<string, string>).database_name ||
				uploadFile_.name.replace(/\.[^.]+$/, "");
			onUpdate({
				databaseId: dbId,
				databaseName: dbName,
				tables: [],
			});
			setUploadFile(null);
			loadStructure(dbId);
		} catch (err) {
			setCreateError(
				err instanceof Error ? err.message : "Unknown error",
			);
		} finally {
			setIsCreatingDb(false);
		}
	}, [
		uploadFile_,
		configStore.store.insightID,
		monolithStore,
		loadEngines,
		onUpdate,
		loadStructure,
	]);

	const handleFileDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			setUploadFile(file);
			setCreateError("");
		}
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0] ?? null;
			setUploadFile(file);
			setCreateError("");
		},
		[],
	);

	// Sync selected tables into state when user proceeds
	// biome-ignore lint/correctness/useExhaustiveDependencies: onUpdate and state.tables are stable references that shouldn't trigger re-sync
	useEffect(() => {
		if (!state.databaseId || tables.length === 0) return;

		const configs: TableConfig[] = selectedTables
			.map((tableName) => {
				const tableInfo = tables.find((t) => t.table === tableName);
				if (!tableInfo) return null;

				// Preserve existing config if already set
				const existing = state.tables.find(
					(t) => t.table === tableName,
				);
				if (existing) return existing;

				// Build default field configs
				const defaultFields = (_op: string): FieldConfig[] =>
					tableInfo.columns.map((col, idx) => ({
						columnName: col.column,
						label: col.column
							.replace(/_/g, " ")
							.replace(/\b\w/g, (c) => c.toUpperCase()),
						widgetType:
							DB_TYPE_TO_WIDGET[col.type.toUpperCase()] || "text",
						dbType: col.type,
						required: false,
						visible: true,
						placeholder: "",
						order: idx,
					}));

				return {
					table: tableName,
					columns: tableInfo.columns,
					operations: ["create", "read"],
					fields: {
						create: defaultFields("create"),
						read: defaultFields("read"),
						update: defaultFields("update"),
						delete: defaultFields("delete"),
					},
				} as TableConfig;
			})
			.filter(Boolean) as TableConfig[];

		onUpdate({ tables: configs });
	}, [selectedTables, tables, state.databaseId]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Connect to a Database</CardTitle>
				<CardDescription>
					Select an existing database or create a new one by uploading
					a file.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Tabs defaultValue="existing">
					<TabsList className="w-full">
						<TabsTrigger value="existing" className="flex-1">
							<DatabaseIcon className="mr-1.5 size-4" />
							Existing Database
						</TabsTrigger>
						<TabsTrigger value="create" className="flex-1">
							<UploadIcon className="mr-1.5 size-4" />
							Create New
						</TabsTrigger>
					</TabsList>

					{/* ---- Existing database tab ---- */}
					<TabsContent
						value="existing"
						className="flex flex-col gap-4 pt-2"
					>
						{/* Search databases */}
						<div className="flex flex-col gap-2">
							<Label>Search Databases</Label>
							<div className="relative">
								<SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
								<Input
									className="pl-9"
									placeholder="Search databases..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>

						{/* Engine list */}
						<div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border p-2">
							{isLoadingEngines ? (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-5" />
								</div>
							) : engines.length === 0 ? (
								<p className="p-4 text-center text-muted-foreground text-sm">
									No databases found.
								</p>
							) : (
								engines.map((engine) => (
									<button
										type="button"
										key={engine.app_id}
										className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
											state.databaseId === engine.app_id
												? "bg-primary text-primary-foreground"
												: "hover:bg-accent"
										}`}
										onClick={() => selectEngine(engine)}
									>
										<DatabaseIcon className="size-4 shrink-0" />
										<div className="flex flex-1 flex-col truncate">
											<span className="font-medium">
												{engine.app_name}
											</span>
											{engine.description && (
												<span className="truncate text-xs opacity-70">
													{engine.description}
												</span>
											)}
										</div>
										{state.databaseId === engine.app_id && (
											<CheckIcon className="size-4 shrink-0" />
										)}
									</button>
								))
							)}
						</div>
					</TabsContent>

					{/* ---- Create new database tab ---- */}
					<TabsContent
						value="create"
						className="flex flex-col gap-4 pt-2"
					>
						<p className="text-muted-foreground text-sm">
							Upload a CSV, TSV, or Excel file to create a new
							database. Each sheet or file becomes a table.
						</p>

						{/* Hidden file input */}
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED_EXTENSIONS}
							className="hidden"
							onChange={handleFileSelect}
						/>

						{/* Drop zone / file display */}
						{uploadFile_ ? (
							<div className="flex flex-col items-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-8 text-center">
								<FileSpreadsheetIcon className="size-10 text-primary" />
								<div className="flex items-center gap-2">
									<span className="font-medium text-sm">
										{uploadFile_.name}
									</span>
									<button
										type="button"
										className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
										onClick={() => {
											setUploadFile(null);
											setCreateError("");
											if (fileInputRef.current)
												fileInputRef.current.value = "";
										}}
									>
										<XIcon className="size-4" />
									</button>
								</div>
								<span className="text-muted-foreground text-xs">
									{(uploadFile_.size / 1024).toFixed(1)} KB
								</span>
							</div>
						) : (
							<button
								type="button"
								className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
									isDragOver
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
								onClick={() => fileInputRef.current?.click()}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragOver(true);
								}}
								onDragLeave={() => setIsDragOver(false)}
								onDrop={handleFileDrop}
							>
								<UploadIcon className="size-10 text-muted-foreground" />
								<div className="flex flex-col gap-1">
									<span className="font-medium text-sm">
										Drop a file here or click to browse
									</span>
									<span className="text-muted-foreground text-xs">
										Supports CSV, TSV, XLS, XLSX
									</span>
								</div>
							</button>
						)}

						{createError && (
							<p className="text-destructive text-sm">
								{createError}
							</p>
						)}

						<Button
							onClick={handleCreateDatabase}
							disabled={!uploadFile_ || isCreatingDb}
						>
							{isCreatingDb && (
								<Spinner className="mr-2 size-4" />
							)}
							{isCreatingDb
								? "Creating Database…"
								: "Create Database & Continue"}
						</Button>
					</TabsContent>
				</Tabs>

				{/* Table selection (shown regardless of which tab was used) */}
				{state.databaseId && (
					<>
						<Separator />
						<div className="flex flex-col gap-2">
							<Label>
								Select Tables from{" "}
								<span className="font-semibold">
									{state.databaseName}
								</span>
							</Label>
							{isLoadingStructure ? (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-5" />
								</div>
							) : tables.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No tables found in this database.
								</p>
							) : (
								<div className="flex flex-col gap-1 rounded-md border p-2">
									{tables.map((t) => (
										<label
											key={t.table}
											className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
										>
											<input
												type="checkbox"
												className="size-4 accent-primary"
												checked={selectedTables.includes(
													t.table,
												)}
												onChange={() =>
													toggleTable(t.table)
												}
											/>
											<span className="font-medium">
												{t.table}
											</span>
											<span className="text-muted-foreground text-xs">
												({t.columns.length} columns)
											</span>
										</label>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};
