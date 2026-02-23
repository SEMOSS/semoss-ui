import { Code2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { usePixel } from "@/hooks";
import { isQueryValid, PreviewPanel, SQLQueryEditorPanel } from "../../shared";

export interface ParameterQueryConfig {
	databaseId: string;
	databaseName: string;
	sqlQuery: string;
	optionLabel: string;
	optionValue: string;
	optionSublabel?: string;
	previewData?: {
		headers: string[];
		rows: unknown[][];
	};
}

interface ParameterQueryDialogProps {
	open: boolean;
	onClose: () => void;
	parameterName: string;
	initialData?: Partial<ParameterQueryConfig>;
	onSave: (config: ParameterQueryConfig) => void;
}

export const ParameterQueryDialog = (props: ParameterQueryDialogProps) => {
	const { open, onClose, parameterName, initialData, onSave } = props;

	// Query state
	const [selectedDatabase, setSelectedDatabase] = useState<string>(
		initialData?.databaseId || "",
	);
	const [databaseName, setDatabaseName] = useState<string>(
		initialData?.databaseName || "",
	);
	const [sqlQuery, setSqlQuery] = useState<string>(
		initialData?.sqlQuery || "-- SELECT column1, column2, column3 FROM...",
	);

	// LLM generation state
	const [generateQuery, setGenerateQuery] = useState<boolean>(false);
	const [selectedLLM, setSelectedLLM] = useState<string>("");
	const [isGeneratingSql, setIsGeneratingSql] = useState<boolean>(false);
	const [generatedSqlPending, setGeneratedSqlPending] = useState<
		string | null
	>(null);
	const [originalPrompt, setOriginalPrompt] = useState<string>("");

	// Preview state
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
	const [previewRows, setPreviewRows] = useState<unknown[][]>([]);

	// Column mapping state
	const [mappedColumns, setMappedColumns] = useState({
		label: initialData?.optionLabel || "",
		value: initialData?.optionValue || "",
		sublabel: initialData?.optionSublabel || "",
	});

	// Database and LLM lists
	const [userDatabases, setUserDatabases] = useState<{
		ids: string[];
		display: Record<string, string>;
	}>({ ids: [], display: {} });
	const [userLLMs, setUserLLMs] = useState<{
		ids: string[];
		display: Record<string, string>;
	}>({ ids: [], display: {} });

	const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
		`MyEngines(engineTypes=['DATABASE']);`,
	);

	const myLLMs = usePixel<{ app_id: string; app_name: string }[]>(
		`MyEngines(engineTypes=['MODEL']);`,
	);
	const { control: formControl } = useForm({
		defaultValues: {
			databaseSelect: "",
		},
	});

	// Load databases
	useEffect(() => {
		try {
			if (myDbs.status !== "SUCCESS") return;
			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			myDbs.data?.forEach((db) => {
				dbIds.push(db.app_id);
				dbDisplay[db.app_id] = db.app_name;
			});
			setUserDatabases({
				ids: dbIds,
				display: dbDisplay,
			});
		} catch (error) {
			toast.error(`Failed to load databases: ${error}`);
		}
	}, [myDbs.status, myDbs.data]);

	// Load LLMs
	useEffect(() => {
		try {
			if (myLLMs.status !== "SUCCESS") return;
			const llmIds: string[] = [];
			const llmDisplay: Record<string, string> = {};
			myLLMs.data?.forEach((llm) => {
				llmIds.push(llm.app_id);
				llmDisplay[llm.app_id] = llm.app_name;
			});
			setUserLLMs({
				ids: llmIds,
				display: llmDisplay,
			});

			// Auto-select first LLM if available
			if (llmIds.length > 0 && !selectedLLM) {
				setSelectedLLM(llmIds[0]);
			}
		} catch (error) {
			toast.error(`Failed to load LLMs: ${error}`);
		}
	}, [myLLMs.status, myLLMs.data, selectedLLM]);

	// Update database name when selection changes
	useEffect(() => {
		if (selectedDatabase && userDatabases.display[selectedDatabase]) {
			setDatabaseName(userDatabases.display[selectedDatabase]);
		}
	}, [selectedDatabase, userDatabases]);

	// Handle mode toggle (SQL ↔ Generate)
	const handleGenerateToggle = () => {
		// Switching from Generate mode to SQL mode
		if (generateQuery) {
			// If there's pending generated SQL, ask user if they want to accept it
			const confirmSwitch = window.confirm(
				"You have generated SQL that hasn't been saved. Do you want to accept it before switching modes?",
			);
			if (confirmSwitch) {
				setShowPreview(false);
				setSqlQuery("--SELECT * FROM...");
				setGeneratedSqlPending(null);
				setOriginalPrompt("");
				setGenerateQuery(false);
			}
			// Stay in Generate mode if no pending SQL
			return;
		} else {
			setSqlQuery("--SELECT * FROM...");
			setGenerateQuery(false);
		}
		// Switching from SQL mode to Generate mode
		setSqlQuery("Describe the data you want to retrieve in plain text.");
		setGenerateQuery(true);
	};

	// Handle SQL generation from LLM
	const handleGenerateSql = async () => {
		if (!selectedDatabase || !selectedLLM || !sqlQuery.trim()) {
			toast.error(
				"Please select a database, LLM model, and enter a description",
			);
			return;
		}

		setIsGeneratingSql(true);

		try {
			// Get database schema
			const schemaPixel = `Database(GetDatabaseMetamodel(database=["${selectedDatabase}"], options=["dataTypes"]));`;
			const schemaResponse = await runPixel(schemaPixel);
			const schemaTables = schemaResponse.pixelReturn[0]?.output;

			if (
				!schemaTables ||
				schemaTables ===
					"Database does not exist or user does not have access to database"
			) {
				toast.warning("No tables found in selected database");
				setIsGeneratingSql(false);
				return;
			}

			// Build prompt for LLM
			const description = sqlQuery.trim();
			const prompt = `Database Schema: ${JSON.stringify(schemaTables)}. Task: Write a SQL query for: "${description}". Return ONLY the valid SQL code. Do not include markdown formatting or explanations.`;
			const safePrompt = prompt
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"')
				.replace(/\n/g, " ");

			// Call LLM
			const llmPixel = `LLM(engine=["${selectedLLM}"], command=["${safePrompt}"]);`;
			const llmResponse = await runPixel(llmPixel);

			const rawLlmOutput = llmResponse.pixelReturn[0]?.output as
				| string
				| { response: string };

			const generatedSql: string =
				typeof rawLlmOutput === "object" && rawLlmOutput?.response
					? rawLlmOutput.response
					: (rawLlmOutput as string);

			if (generatedSql) {
				const cleanedSql = generatedSql
					.replace(/```sql/g, "")
					.replace(/```/g, "")
					.trim();
				setOriginalPrompt(sqlQuery.trim());
				setGeneratedSqlPending(cleanedSql);

				toast.success(
					"SQL query generated successfully. Review and accept to continue.",
				);
			} else {
				toast.error("No response from LLM");
			}
		} catch (error) {
			console.error("Error generating SQL:", error);
			toast.error(`Failed to generate SQL: ${error}`);
		} finally {
			setIsGeneratingSql(false);
		}
	};

	// Handle accept generated SQL
	const handleAcceptGeneratedSql = () => {
		if (generatedSqlPending) {
			setSqlQuery(generatedSqlPending);
			setGeneratedSqlPending(null);
			setOriginalPrompt("");
			setGenerateQuery(false);
		}
	};

	// Handle back to prompt
	const handleBackToPrompt = () => {
		if (originalPrompt) {
			setSqlQuery(originalPrompt);
			setGeneratedSqlPending(null);
			setOriginalPrompt("");
		}
	};

	// Execute SQL query and return preview data
	const executeQueryForPreview = async (): Promise<{
		headers: string[];
		rows: unknown[][];
	} | null> => {
		if (!selectedDatabase || !sqlQuery.trim()) {
			toast.warning("Please select a database and enter a query");
			return null;
		}

		if (!isQueryValid(sqlQuery)) {
			toast.warning("Please enter a valid SQL query");
			return null;
		}

		try {
			// Escape double quotes in SQL query
			const escapedQuery = sqlQuery.replace(/"/g, '\\"');

			// Build pixel query for preview (limit 10 rows)
			const reactorPixel = `Database(database=["${selectedDatabase}"]) | Query("${escapedQuery}") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["param_query_preview"])]) ; META | Frame() | QueryAll() | Limit(10) | Collect(500);`;

			const response = await runPixel(reactorPixel);
			const type = response.pixelReturn[0]?.operationType;

			if (type && type.indexOf("ERROR") !== -1) {
				const error = response.pixelReturn[0]?.output;
				console.error(error);
				toast.error(String(error));
				return null;
			}

			const output = response.pixelReturn[1]?.output as {
				data: {
					values: unknown[][];
					headers: string[];
				};
			};

			return {
				headers: output?.data?.headers || [],
				rows: output?.data?.values || [],
			};
		} catch (error) {
			console.error("Error in preview:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Error running query preview";
			toast.error(errorMessage);
			return null;
		}
	};

	// Handle preview
	const handlePreview = async () => {
		setIsLoadingPreview(true);
		setPreviewError(null);

		const result = await executeQueryForPreview();

		if (result) {
			setPreviewHeaders(result.headers);
			setPreviewRows(result.rows);
			setShowPreview(true);

			// Auto-select first two columns if not already mapped
			if (result.headers && result.headers.length >= 2) {
				if (!mappedColumns.label) {
					setMappedColumns((prev) => ({
						...prev,
						label: result.headers[0],
					}));
				}
				if (!mappedColumns.value) {
					setMappedColumns((prev) => ({
						...prev,
						value: result.headers[1],
					}));
				}
			}
		} else {
			setShowPreview(false);
		}

		setIsLoadingPreview(false);
	};

	// Handle save
	const handleSave = async () => {
		// Validation
		if (!selectedDatabase) {
			toast.error("Please select a database");
			return;
		}

		if (!sqlQuery.trim() || !isQueryValid(sqlQuery)) {
			toast.error("Please enter a valid SQL query");
			return;
		}

		// If preview data hasn't been loaded yet, execute the query to load it
		let headers = previewHeaders;
		let rows = previewRows;
		const columnMappings = { ...mappedColumns };

		if (headers.length === 0 || rows.length === 0) {
			toast.info("Loading options data...");

			const result = await executeQueryForPreview();

			if (result) {
				headers = result.headers;
				rows = result.rows;

				// Update state for future use
				setPreviewHeaders(headers);
				setPreviewRows(rows);

				// Auto-select column mappings if not set
				if (headers.length >= 2) {
					if (!columnMappings.label) {
						columnMappings.label = headers[0];
						setMappedColumns((prev) => ({
							...prev,
							label: headers[0],
						}));
					}
					if (!columnMappings.value) {
						columnMappings.value = headers[1];
						setMappedColumns((prev) => ({
							...prev,
							value: headers[1],
						}));
					}
				}
			} else {
				toast.error(
					"Failed to load options data. Please fix any query errors and try again.",
				);
				return;
			}
		}

		// Build config with preview data
		const config: ParameterQueryConfig = {
			databaseId: selectedDatabase,
			databaseName: databaseName,
			sqlQuery: sqlQuery.trim(),
			optionLabel: columnMappings.label,
			optionValue: columnMappings.value,
			optionSublabel: columnMappings.sublabel || undefined,
			previewData:
				headers.length > 0 && rows.length > 0
					? {
							headers: headers,
							rows: rows,
						}
					: undefined,
		};

		onSave(config);
		onClose();
	};

	// Handle cancel
	const handleCancel = () => {
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="max-h-[90vh] max-w-[1200px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{generateQuery ? (
							<>
								<span>
									{`Configure Generated Query for ${parameterName}`}
								</span>
								<Sparkles className="size-6 text-primary" />
							</>
						) : (
							<>
								<span>{`Configure Query for ${parameterName}`}</span>
								<Code2 className="size-6" />
							</>
						)}
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							{selectedDatabase !== "" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center gap-2">
											<Switch
												checked={generateQuery}
												onCheckedChange={
													handleGenerateToggle
												}
												disabled={isGeneratingSql}
											/>
											<Label>Generate</Label>
										</div>
									</TooltipTrigger>
									<TooltipContent>
										Toggle between writing SQL code or
										describing what you want in plain text
									</TooltipContent>
								</Tooltip>
							)}
							{generateQuery && (
								<Select
									value={selectedLLM}
									onValueChange={setSelectedLLM}
								>
									<SelectTrigger className="w-[220px]">
										<SelectValue placeholder="Select LLM" />
									</SelectTrigger>
									<SelectContent>
										{userLLMs.ids.map((llmId, llmIndex) => (
											<SelectItem
												value={llmId}
												key={`${llmIndex}-${llmId}`}
											>
												{userLLMs.display[llmId] ?? ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							<Controller
								name="databaseSelect"
								control={formControl}
								render={({ field }) => (
									<Select
										value={selectedDatabase}
										onValueChange={(value) => {
											field.onChange(value);
											setSelectedDatabase(value);
										}}
									>
										<SelectTrigger className="w-[220px]">
											<SelectValue placeholder="Select Database" />
										</SelectTrigger>
										<SelectContent>
											{userDatabases.ids.map(
												(databaseId, dbIndex) => (
													<SelectItem
														value={databaseId}
														key={`${dbIndex}-${databaseId}`}
													>
														{userDatabases.display[
															databaseId
														] ?? ""}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>
					{/* SQL Query Editor */}
					{selectedDatabase && (
						<div>
							<div
								className="flex flex-col overflow-hidden transition-all duration-300"
								style={{
									height: showPreview ? "65%" : "100%",
								}}
							/>
							<div className="mt-2">
								<SQLQueryEditorPanel
									selectedDatabase={selectedDatabase}
									onDatabaseChange={(dbId) =>
										setSelectedDatabase(dbId)
									}
									userDatabases={userDatabases}
									sqlQuery={sqlQuery}
									onQueryChange={setSqlQuery}
									showPreview={showPreview}
									onPreviewToggle={() => {
										if (showPreview) {
											setShowPreview(false);
										} else {
											handlePreview();
										}
									}}
									enableGenerate={true}
									generateMode={generateQuery}
									onGenerateModeToggle={handleGenerateToggle}
									selectedLLM={selectedLLM}
									onLLMChange={setSelectedLLM}
									userLLMs={userLLMs}
									onGenerateSql={handleGenerateSql}
									isGenerating={isGeneratingSql}
									generatedSqlPending={generatedSqlPending}
									onAcceptGeneratedSql={
										handleAcceptGeneratedSql
									}
									onBackToPrompt={handleBackToPrompt}
									showFrameConfig={false}
								/>
							</div>
							{/* Preview */}
							{showPreview && (
								<PreviewPanel
									mode="query"
									title="Query Preview"
									subtitle="First 10 rows - verify your query returns the expected columns"
									queryData={{
										headers: previewHeaders,
										rows: previewRows,
										loading: isLoadingPreview,
										error: previewError,
										emptyMessage: "No rows returned",
									}}
									height="25vh"
								/>
							)}
						</div>
					)}
					{!selectedDatabase && (
						<div className="rounded-lg bg-gray-100 p-4 text-center">
							<p className="font-medium text-muted-foreground text-sm">
								Please select a database to begin configuring
								your query
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button onClick={handleCancel} variant="outline">
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={!selectedDatabase || !sqlQuery.trim()}
					>
						Save Configuration
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
