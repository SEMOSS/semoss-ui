import { useEffect, useId, useState } from "react";
import type { ColumnInterface } from "@semoss/sdk/react";
import { upload } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FileDropzone,
	Input,
	Muted,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

const NEW_DATABASE = "TABLE";

interface DatabaseUploadFileProps {
	/** Engine (database) id to query */
	engine: string;

	/** usePixel return to get the table structure */
	structure: {
		table: string;
		columns: ColumnInterface[];
	}[];

	/** Selected table */
	table: string;

	/** Track if open */
	open: boolean;

	/** Callback when the dialog is closed */
	onClose: (success: boolean) => void;
}

export const DatabaseUploadCsv = ({
	engine,
	structure,
	table,
	open,
	onClose,
}: DatabaseUploadFileProps) => {
	const { configStore } = useRootStore();

	const targetTableId = useId();
	const appendModeId = useId();
	const replaceModeId = useId();
	const delimiterInputId = useId();
	const newTableNameId = useId();

	// Step state
	const [step, setStep] = useState<"upload" | "preview">("upload");

	// Step 1: Upload & Delimiter
	const [file, setFile] = useState<File | null>(null);
	const [delimiter, setDelimiter] = useState(",");

	// Step 2: Preview & Configuration
	const [filePath, setFilePath] = useState<string>("");

	const [headers, setHeaders] = useState<string[]>([]);
	const [values, setValues] = useState<unknown[][]>([]);

	const [target, setTarget] = useState("");
	const [newTableName, setNewTableName] = useState("");
	const [method, setMethod] = useState<"append" | "replace">("append");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		// Reset to step 1 when dialog opens
		setStep("upload");
		setFile(null);
		setDelimiter(",");
		setFilePath("");
		setHeaders([]);
		setValues([]);
		setTarget(table);
		setNewTableName("");
		setMethod("append");
	}, [open, table]);

	/**
	 * Handle previewing the data by uploading the file and executing a FileRead pixel to get the first 500 rows.
	 * @returns
	 */
	const handlePreviewData = async () => {
		if (!file) {
			toast.error("Please choose a file.");
			return;
		}

		if (!delimiter) {
			toast.error("Please enter a delimiter.");
			return;
		}

		try {
			setIsLoading(true);

			// Upload file first
			const uploaded = await upload(
				file,
				configStore.store.insightID,
				"",
				"",
			);

			if (!uploaded?.length || !uploaded[0]?.fileLocation) {
				toast.error("File upload failed.");
				return;
			}

			const filePath = uploaded[0].fileLocation;

			// preview the data
			const pixel = `FileRead(filePath=[${JSON.stringify(filePath)}], delimiter=[${JSON.stringify(delimiter)}]) | Iterate() | Collect(500);`;

			const response =
				await configStore.runPixel<
					[
						{
							data: {
								headers: string[];
								values: unknown[][];
							};
							headerInfo: {
								dataType: string;
								additionalDataType: string;
								alias: string;
								header: string;
								type: string;
								derived: boolean;
							}[];
						},
					]
				>(pixel);

			if (response.errors?.length > 0) {
				throw new Error(response.errors?.join("\n"));
			}

			const output = response.pixelReturn[0].output;

			setFilePath(filePath);
			setHeaders(output.data.headers);
			setValues(output.data.values);
			setStep("preview");
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "An error occurred while previewing the file.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handle uploading the table data
	 * @returns
	 */
	const handleUploadTableData = async () => {
		if (!engine) {
			toast.error("No active database selected.");
			return;
		}

		// Validate target
		let resolvedTarget = target;
		if (target === NEW_DATABASE) {
			if (!newTableName || newTableName.trim() === "") {
				toast.error("Please enter a table name for the new table.");
				return;
			}

			for (const t of structure) {
				if (t.table === newTableName) {
					toast.error(
						`Table "${newTableName}" already exists. Please choose a different name.`,
					);
					return;
				}
			}

			resolvedTarget = newTableName;
		}

		if (!resolvedTarget) {
			toast.error("Please select or create a target table.");
			return;
		}

		try {
			setIsLoading(true);

			// Build the upload pixel using RdbmsUploadTableData pattern
			const pixel = `FileRead(filePath=[${JSON.stringify(filePath)}], delimiter=[${JSON.stringify(delimiter)}]) | ToDatabase(targetDatabase=[${JSON.stringify(engine)}], targetTable=[${JSON.stringify(resolvedTarget)}], override=[${method === "replace"}]);`;

			const response = await configStore.runPixel(pixel);
			if (response.errors?.length > 0) {
				throw new Error(response.errors?.join("\n"));
			}

			toast.success(
				method === "replace"
					? `Replaced table ${resolvedTarget}.`
					: target === "new"
						? `Created and populated new table ${resolvedTarget}.`
						: `Appended rows to ${resolvedTarget}.`,
			);

			onClose(true);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "An error occurred while uploading.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={() => {
				if (isLoading) {
					return;
				}

				onClose(false);
			}}
		>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>
						{step === "upload"
							? "Upload File"
							: "Preview & Configure"}
					</DialogTitle>
					<DialogDescription>
						{step === "upload"
							? "Select a file to preview the data."
							: "Review the preview, rename columns if needed, and select a target table."}
					</DialogDescription>
				</DialogHeader>

				{step === "upload" ? (
					// ===== STEP 1: UPLOAD & DELIMITER =====
					<FieldGroup>
						<Field>
							<FieldLabel>File</FieldLabel>
							<FileDropzone
								extensions={[".csv"]}
								multiple={false}
								value={file}
								onChange={(v) => {
									setFile(v as File | null);
								}}
								disabled={isLoading}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor={delimiterInputId}>
								Delimiter
							</FieldLabel>
							<Input
								id={delimiterInputId}
								type="text"
								placeholder=","
								value={delimiter}
								onChange={(e) => setDelimiter(e.target.value)}
								disabled={isLoading}
								maxLength={1}
							/>
						</Field>
					</FieldGroup>
				) : (
					// ===== STEP 2: PREVIEW & CONFIGURATION =====
					<div className="space-y-4">
						{/* Preview Table */}
						<Field>
							<FieldLabel className="mb-2 block">
								Preview
							</FieldLabel>
							<div className="flex h-[40vh] w-full flex-col items-center justify-center overflow-hidden">
								{values.length === 0 ? (
									<div className="flex w-full flex-1 items-center justify-center rounded-md border border-border">
										<Muted>No data</Muted>
									</div>
								) : (
									<Table wrapperClassName="flex-1 w-full rounded-md border border-border overflow-auto">
										<TableHeader className="sticky top-0 z-10 bg-secondary">
											<TableRow>
												{headers.map((header) => (
													<TableHead key={header}>
														{header}
													</TableHead>
												))}
											</TableRow>
										</TableHeader>
										<TableBody>
											{values.map((row, rowIdx) => (
												// biome-ignore lint/suspicious/noArrayIndexKey: Preview rows are stable and won't reorder
												<TableRow key={`row-${rowIdx}`}>
													{(row as unknown[]).map(
														(cell, cellIdx) => (
															<TableCell
																key={
																	headers[
																		cellIdx
																	]
																}
															>
																{String(
																	cell ?? "",
																)}
															</TableCell>
														),
													)}
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</div>
						</Field>

						{/* Target Table Selection */}
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={targetTableId}>
									Target Table
								</FieldLabel>
								<Select
									value={target}
									onValueChange={(value) => {
										setTarget(value);
										setNewTableName("");
									}}
									disabled={isLoading}
								>
									<SelectTrigger
										id={targetTableId}
										className="w-full"
									>
										<SelectValue placeholder="Select a table or create new" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value={NEW_DATABASE}
											className="text-muted-foreground italic"
										>
											New
										</SelectItem>
										{structure.map((t) => (
											<SelectItem
												key={t.table}
												value={t.table}
											>
												{t.table}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							{target === NEW_DATABASE && (
								<Field>
									<FieldLabel htmlFor={newTableNameId}>
										New Table Name
									</FieldLabel>
									<Input
										id={newTableNameId}
										type="text"
										placeholder="Enter table name"
										value={newTableName}
										onChange={(e) =>
											setNewTableName(e.target.value)
										}
										disabled={isLoading}
									/>
								</Field>
							)}

							{target && target !== NEW_DATABASE && (
								<Field>
									<FieldLabel>Mode</FieldLabel>
									<RadioGroup
										value={method}
										onValueChange={(value) => {
											if (
												value === "append" ||
												value === "replace"
											) {
												setMethod(value);
											}
										}}
										disabled={isLoading}
										className="gap-2"
									>
										<Field
											orientation="horizontal"
											className="items-center"
										>
											<RadioGroupItem
												id={appendModeId}
												value="append"
											/>
											<FieldLabel
												htmlFor={appendModeId}
												className="font-normal"
											>
												Append rows
											</FieldLabel>
										</Field>
										<Field
											orientation="horizontal"
											className="items-center"
										>
											<RadioGroupItem
												id={replaceModeId}
												value="replace"
											/>
											<FieldLabel
												htmlFor={replaceModeId}
												className="font-normal"
											>
												Replace all rows
											</FieldLabel>
										</Field>
									</RadioGroup>
								</Field>
							)}
						</FieldGroup>
					</div>
				)}

				<DialogFooter>
					{step === "upload" ? (
						// Step 1 footer
						<>
							<Button
								variant="outline"
								onClick={() => onClose(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								onClick={handlePreviewData}
								disabled={isLoading || !upload}
							>
								{isLoading ? <Spinner /> : "Next"}
							</Button>
						</>
					) : (
						// Step 2 footer
						<>
							<Button
								onClick={() => onClose(false)}
								variant="outline"
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setStep("upload");
									setFilePath("");
									setHeaders([]);
									setValues([]);
								}}
								disabled={isLoading}
							>
								Back
							</Button>

							<Button
								onClick={handleUploadTableData}
								disabled={isLoading}
							>
								{isLoading ? <Spinner /> : "Upload"}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
