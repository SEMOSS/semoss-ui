import { Code, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { runPixel } from "@semoss/sdk/react";
import {
	Card,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { usePixel } from "@/hooks";
import type { FilterParameter, SavedQuery } from "../../insight.types";
import { PreviewPanel } from "../shared";
import {
	isQueryValid,
	SQLQueryEditorPanel,
} from "../shared/SQLQueryEditorPanel";
import { ParameterDefinitionView } from "./parameter/ParameterDefinitionView";

// Type for Monaco editor instance
interface MonacoEditorInstance {
	setValue: (value: string) => void;
	getValue: () => string;
	getModel: () => { getLineCount: () => number } | null;
	getLayoutInfo: () => { width: number; height: number };
	layout: (dimension: { width: number; height: number }) => void;
}

interface QueryBuilderStepProps {
	savedQueries: SavedQuery[];
	onSaveQuery: (query: SavedQuery) => void;
	onDeleteQuery: (id: string) => void;
	onEditQuery: (query: SavedQuery | null) => void;
	queryToEdit: SavedQuery | null;
	onEditingQueryIdChange: (id: string | null) => void;
	selectedLLM: string;
	onLLMChange: (llm: string) => void;
	savedParameters: FilterParameter[];
	parameterToEdit: FilterParameter | null;
	onParameterSave: (param: FilterParameter) => void;
	onEditParameter: (param: FilterParameter | null) => void;
	onDeleteParameter: (id: string) => void;
}

export const QueryBuilderStep = (props: QueryBuilderStepProps) => {
	const {
		onSaveQuery,
		onEditQuery,
		queryToEdit,
		onEditingQueryIdChange,
		selectedLLM,
		onLLMChange,
		savedQueries,
		savedParameters,
		parameterToEdit,
		onParameterSave,
		onEditParameter,
		onDeleteParameter,
	} = props;

	const editorRef = useRef<MonacoEditorInstance | null>(null);
	const baseId = useId();

	const [activeTab, setActiveTab] = useState<"parameters" | "queries">(
		"queries",
	);
	const [selectedDatabase, setSelectedDatabase] = useState<string>("");
	const [generateQuery, setGenerateQuery] = useState<boolean>(false);
	const [sqlQuery, setSqlQuery] = useState<string>("--SELECT * FROM...");
	const [generatedSqlPending, setGeneratedSqlPending] = useState<
		string | null
	>(null);
	const [originalPrompt, setOriginalPrompt] = useState<string>("");
	const [frameType, setFrameType] = useState<string>("GRID");
	const [frameVariableName, setFrameVariableName] = useState<string>("");
	const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
	const [userDatabases, setUserDatabases] = useState<{
		ids: string[];
		display: Record<string, string>;
	}>({ ids: [], display: {} });
	const [userLLMs, setUserLLMs] = useState<{
		ids: string[];
		display: Record<string, string>;
	}>({ ids: [], display: {} });

	// Preview state
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [isDatabaseLoading, setIsDatabaseLoading] = useState<boolean>(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [databaseTableRows, setDatabaseTableRows] = useState<unknown[][]>([]);
	const [databaseTableHeaders, setDatabaseTableHeaders] = useState<string[]>(
		[],
	);
	const [isGeneratingSql, setIsGeneratingSql] = useState<boolean>(false);

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
			if (myDbs.status !== "SUCCESS") {
				return;
			}
			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			myDbs.data?.forEach((db) => {
				dbIds.push(db.app_id);
				dbDisplay[db.app_id] = db.app_name;
			});
			setUserDatabases({
				// loading: false,
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
			if (myLLMs.status !== "SUCCESS") {
				return;
			}
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
		} catch (error) {
			toast.error(`Failed to load LLM models: ${error}`);
		}
	}, [myLLMs.status, myLLMs.data]);

	// Handle external edit requests from sidebar
	// biome-ignore lint/correctness/useExhaustiveDependencies: handleEdit / onEdit -query are not dependencies.
	useEffect(() => {
		if (queryToEdit) {
			setActiveTab("queries");
			handleEditQuery(queryToEdit);
			// Reset queryToEdit after handling
			onEditQuery(null);
		}
	}, [queryToEdit]);

	// Notify parent of editing state changes
	useEffect(() => {
		onEditingQueryIdChange(editingQueryId);
	}, [editingQueryId, onEditingQueryIdChange]);

	const retrievePreviewData = async () => {
		setIsDatabaseLoading(true);
		setPreviewError(null);

		try {
			// Use pending SQL if available, otherwise use sqlQuery
			const queryToPreview = generatedSqlPending || sqlQuery;
			// Escape double quotes in SQL query
			const escapedQuery = queryToPreview.replace(/"/g, '\\"');

			// Build pixel query for preview
			const reactorPixel = `Database ( database = [ "${selectedDatabase}" ] ) | Query ( "${escapedQuery}" ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "query_import_preview_frame" ] ) ] ) ; META | Frame() | QueryAll() | Limit(20) | Collect(500);`;

			runPixel(reactorPixel).then((response) => {
				const type = response.pixelReturn[0]?.operationType;

				const o = response.pixelReturn[1]?.output as {
					data: {
						values: unknown[][];
						headers: string[];
					};
				};
				const tableHeadersData = o.data?.headers;
				const tableRowsData = o.data?.values;

				if (type.indexOf("ERROR") !== -1) {
					const error = response.pixelReturn[0]?.output;
					console.error(`${error}`);
					setPreviewError(`${error}`);
					toast.error(`${error}`);
					setIsDatabaseLoading(false);
					return;
				}

				setDatabaseTableHeaders(tableHeadersData);
				setDatabaseTableRows(tableRowsData);
				setIsDatabaseLoading(false);
			});
		} catch (error) {
			console.error("Error in preview:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Error running query preview";
			setPreviewError(errorMessage);
			setIsDatabaseLoading(false);

			toast.error(errorMessage);
		}
	};

	const handleSaveQuery = () => {
		if (
			!selectedDatabase ||
			!sqlQuery.trim() ||
			!frameVariableName?.trim()
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		const query: SavedQuery = {
			id:
				editingQueryId ||
				`query-${userDatabases.display[selectedDatabase]}-${frameVariableName}`,
			databaseId: selectedDatabase,
			databaseName: userDatabases.display[selectedDatabase] || "",
			sqlQuery,
			frameType,
			frameVariableName,
		};

		onSaveQuery(query);

		toast.success(editingQueryId ? "Query updated" : "Query saved");

		// Reset form
		setEditingQueryId(null);
		setSqlQuery("--SELECT * FROM...");
		setFrameVariableName("");
		setFrameType("GRID");
	};

	const handleEditQuery = (query: SavedQuery) => {
		setEditingQueryId(query.id);
		setSelectedDatabase(query.databaseId);
		setSqlQuery(query.sqlQuery);
		setFrameVariableName(query.frameVariableName);
		setFrameType(query.frameType);
	};

	const handleCancelEdit = () => {
		setEditingQueryId(null);
		setSqlQuery("--SELECT * FROM...");
		setFrameVariableName("");
		setFrameType("GRID");
	};

	const handleGenerateToggle = () => {
		if (generateQuery) {
			// Switching from Generate mode to SQL mode
			if (generatedSqlPending) {
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
				// Stay in Generate mode
				return;
			} else {
				setSqlQuery("--SELECT * FROM...");
				setGenerateQuery(false);
			}
		} else {
			// Switching from SQL mode to Generate mode
			setSqlQuery(
				"Describe the data you want to retrieve in plain text.",
			);
			setGenerateQuery(true);
		}
	};

	const handleGenerateSql = async () => {
		if (!selectedDatabase || !selectedLLM || !sqlQuery.trim()) {
			toast.error(
				"Please select a database, LLM model, and enter a description",
			);
			return;
		}

		setIsGeneratingSql(true);

		try {
			// Get database schema (tables)
			const schemaPixel = `Database(GetDatabaseMetamodel(database=["${selectedDatabase}"], options=["dataTypes"]));`;
			const schemaResponse = await runPixel(schemaPixel);
			// if the output is wrapped
			const schemaTables = schemaResponse.pixelReturn[0]?.output;

			if (
				!schemaTables ||
				schemaTables ===
					"Database does not exist or user does not have access to database" ||
				schemaTables ===
					"Unable to connect to server for python model engine."
			) {
				toast.warning("No tables found in selected database");
				setIsGeneratingSql(false);
				return;
			}

			// Build prompt for LLM
			const description = sqlQuery.trim();
			const schemaStr = schemaTables;
			const prompt = `Database Schema: ${JSON.stringify(schemaStr)}. Task: Write a SQL query for: "${description}". Return ONLY the valid SQL code. Do not include markdown formatting or explanations.`;
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
				// Save the original prompt before setting pending SQL
				setOriginalPrompt(sqlQuery.trim());
				setGeneratedSqlPending(cleanedSql);

				// Update editor if it exists
				if (editorRef.current) {
					editorRef.current.setValue(cleanedSql);
				}

				toast.success(
					"SQL query generated successfully. Review and accept to continue.",
				);
			} else {
				toast.error("No response from LLM");
			}
		} catch (error) {
			console.error("Error generating SQL:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Error generating SQL";

			toast.error(errorMessage);
		} finally {
			setIsGeneratingSql(false);
		}
	};

	const handleAcceptAndSave = () => {
		if (!generatedSqlPending) return;

		// Validate frame name
		if (!frameVariableName?.trim()) {
			toast.error("Please enter a frame name before saving.");
			return;
		}

		// Save the query
		const query: SavedQuery = {
			id:
				editingQueryId ||
				`query-${userDatabases.display[selectedDatabase]}-${frameVariableName}`,
			databaseId: selectedDatabase,
			databaseName: userDatabases.display[selectedDatabase] || "",
			sqlQuery: generatedSqlPending,
			frameType,
			frameVariableName,
		};

		onSaveQuery(query);

		// Update state
		setSqlQuery(generatedSqlPending);
		setGeneratedSqlPending(null);
		setOriginalPrompt(""); // Clear saved prompt
		setGenerateQuery(false); // Switch to SQL mode

		toast.success("Query saved successfully!");

		// Reset form
		setEditingQueryId(null);
		setFrameVariableName("");
		setFrameType("GRID");
	};

	const handleBackToPrompt = () => {
		// Clear pending SQL and restore the original prompt
		setGeneratedSqlPending(null);
		setSqlQuery(
			originalPrompt ||
				"Describe the data you want to retrieve in plain text.",
		);
		setShowPreview(false);
		// Update editor if it exists
		if (editorRef.current && originalPrompt) {
			editorRef.current.setValue(originalPrompt);
		}
	};

	return (
		<Card className="flex h-full flex-col overflow-hidden p-6">
			<div className="flex min-h-0 flex-1 flex-col gap-2">
				{/* Tabs for Parameters and Queries */}
				<Tabs
					value={activeTab}
					onValueChange={(val) =>
						setActiveTab(val as "parameters" | "queries")
					}
					className="flex min-h-0 flex-1 flex-col"
				>
					<TabsList>
						<TabsTrigger value="queries">Queries</TabsTrigger>
						<TabsTrigger value="parameters">Parameters</TabsTrigger>
					</TabsList>

					{/* Parameters Tab Panel */}
					<TabsContent
						value="parameters"
						className="min-h-0 flex-1 overflow-hidden"
					>
						<ParameterDefinitionView
							savedParameters={savedParameters}
							savedQueries={savedQueries}
							parameterToEdit={parameterToEdit}
							onParameterSave={onParameterSave}
							onEditParameter={onEditParameter}
							onDeleteParameter={onDeleteParameter}
						/>
					</TabsContent>

					{/* Queries Tab Panel */}
					<TabsContent
						value="queries"
						className="min-h-0 flex-1 overflow-hidden"
					>
						<div className="flex h-full min-h-0 flex-col gap-2">
							<div className="flex flex-row items-center justify-between">
								<div className="flex flex-row items-center gap-2">
									{generateQuery ? (
										<>
											<h2 className="font-semibold text-lg">
												{editingQueryId
													? "Edit Generated Query"
													: "Generate Query"}
											</h2>
											<Sparkles className="size-6 text-primary" />
										</>
									) : (
										<>
											<h2 className="font-semibold text-lg">
												{editingQueryId
													? "Edit Query"
													: "Enter Query"}
											</h2>
											<Code className="size-6" />
										</>
									)}
								</div>
								<div className="flex flex-row items-center gap-2">
									{selectedDatabase !== "" && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-2">
														<Label htmlFor="generate-toggle">
															Generate
														</Label>
														<Switch
															id={`generate-toggle-${baseId}`}
															checked={
																generateQuery
															}
															onCheckedChange={
																handleGenerateToggle
															}
															disabled={
																isGeneratingSql
															}
														/>
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>
														Toggle between writing
														SQL code or describing
														what you want in plain
														text
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
									{generateQuery && (
										<Select
											value={selectedLLM || ""}
											onValueChange={(val) =>
												onLLMChange(val)
											}
										>
											<SelectTrigger className="min-w-[220px]">
												<SelectValue placeholder="Select LLM" />
											</SelectTrigger>
											<SelectContent>
												{userLLMs.ids.map(
													(llmId, llmIndex) => (
														<SelectItem
															value={llmId}
															key={`${llmIndex}-${llmId}`}
														>
															{userLLMs.display[
																llmId
															] ?? ""}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									)}
									<Controller
										name="databaseSelect"
										control={formControl}
										render={({ field }) => (
											<Select
												value={selectedDatabase || ""}
												onValueChange={(val) => {
													field.onChange(val);
													setSelectedDatabase(val);
												}}
											>
												<SelectTrigger className="min-w-[220px]">
													<SelectValue placeholder="Select Database" />
												</SelectTrigger>
												<SelectContent>
													{userDatabases.ids.map(
														(
															databaseId,
															dbIndex,
														) => (
															<SelectItem
																value={
																	databaseId
																}
																key={`${dbIndex}-${databaseId}`}
															>
																{userDatabases
																	.display[
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

							{selectedDatabase && (
								<div className="flex flex-1 flex-col overflow-hidden">
									<div
										className="flex flex-col overflow-hidden transition-[height] duration-300"
										style={{
											height: showPreview
												? "30vh"
												: "100%",
										}}
									>
										<SQLQueryEditorPanel
											selectedDatabase={selectedDatabase}
											onDatabaseChange={
												setSelectedDatabase
											}
											userDatabases={userDatabases}
											sqlQuery={sqlQuery}
											onQueryChange={setSqlQuery}
											enableGenerate={true}
											generateMode={generateQuery}
											onGenerateModeToggle={
												handleGenerateToggle
											}
											selectedLLM={selectedLLM}
											onLLMChange={onLLMChange}
											userLLMs={userLLMs}
											onGenerateSql={handleGenerateSql}
											isGenerating={isGeneratingSql}
											generatedSqlPending={
												generatedSqlPending
											}
											onAcceptGeneratedSql={
												handleAcceptAndSave
											}
											onBackToPrompt={handleBackToPrompt}
											showFrameConfig={true}
											frameType={frameType}
											onFrameTypeChange={setFrameType}
											frameVariableName={
												frameVariableName
											}
											onFrameVariableNameChange={
												setFrameVariableName
											}
											onSave={handleSaveQuery}
											onCancel={handleCancelEdit}
											onPreviewToggle={() => {
												if (showPreview) {
													setShowPreview(false);
												} else {
													setShowPreview(true);
													retrievePreviewData();
												}
											}}
											showPreview={showPreview}
											editMode={!!editingQueryId}
											editorRef={editorRef}
											savedParameters={savedParameters}
										/>
									</div>

									{showPreview && (
										<PreviewPanel
											mode="query"
											title="Preview"
											subtitle="The preview uses a subset of your data and may not be accurately represented below."
											queryData={{
												headers: databaseTableHeaders,
												rows: databaseTableRows,
												loading: isDatabaseLoading,
												error: previewError,
												emptyMessage: "No Rows",
											}}
											showInvalidQueryMessage={
												!isQueryValid(sqlQuery)
											}
											invalidQueryMessage="Enter a SQL query to view preview"
											height="30vh"
										/>
									)}
								</div>
							)}

							{!selectedDatabase && (
								<div className="p-4 text-center">
									<p className="text-muted-foreground text-sm">
										Select a Database to Create Queries
									</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</Card>
	);
};
