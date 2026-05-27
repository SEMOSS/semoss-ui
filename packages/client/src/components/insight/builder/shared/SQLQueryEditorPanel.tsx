import { Info, Maximize2, Pencil, RefreshCw } from "lucide-react";
import { type RefObject, Suspense, useRef } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	cn,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { FilterParameter } from "../../insight.types";
import { DatabaseAccordions } from "./database-accordions";

const EDITOR_LINE_HEIGHT = 19;

interface MonacoEditorInstance {
	setValue: (value: string) => void;
	getValue: () => string;
	getModel: () => { getLineCount: () => number } | null;
	getLayoutInfo: () => { width: number; height: number };
	layout: (dimension: { width: number; height: number }) => void;
}

export interface SQLQueryEditorPanelProps {
	// Database selection
	selectedDatabase: string;
	onDatabaseChange: (dbId: string) => void;
	userDatabases: {
		ids: string[];
		display: Record<string, string>;
	};

	// SQL Query
	sqlQuery: string;
	onQueryChange: (sql: string) => void;

	// Optional LLM generation features
	enableGenerate?: boolean;
	generateMode?: boolean;
	onGenerateModeToggle?: () => void;
	selectedLLM?: string;
	onLLMChange?: (llmId: string) => void;
	userLLMs?: {
		ids: string[];
		display: Record<string, string>;
	};
	onGenerateSql?: () => void;
	isGenerating?: boolean;
	generatedSqlPending?: string | null;
	onAcceptGeneratedSql?: () => void;
	onBackToPrompt?: () => void;

	// Frame configuration (for query builder)
	showFrameConfig?: boolean;
	frameType?: string;
	onFrameTypeChange?: (type: string) => void;
	frameVariableName?: string;
	onFrameVariableNameChange?: (name: string) => void;

	// Actions
	onSave?: () => void;
	onCancel?: () => void;
	onPreviewToggle?: () => void;
	showPreview?: boolean;

	// Editor state
	editMode?: boolean;
	editorRef?: RefObject<MonacoEditorInstance | null>;

	// Validation
	savedParameters?: FilterParameter[]; // For {{param}} detection

	// Custom action buttons (optional)
	customActions?: React.ReactNode;
}

/**
 * Check if the query contains parameter references like {{param1}}
 */
export const hasParameterReferences = (query: string): boolean => {
	if (!query) return false;
	const paramPattern = /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/;
	return paramPattern.test(query);
};

/**
 * Determine if the text is plain text description (not SQL)
 */
export const isPlainText = (query: string): boolean => {
	const trimmedQuery = query.trim();

	if (!trimmedQuery || trimmedQuery.startsWith("--")) {
		return false;
	}

	// Remove comments first
	const withoutLineComments = trimmedQuery.replace(/--.*$/gm, "");
	const withoutBlockComments = withoutLineComments.replace(
		/\/\*[\s\S]*?\*\//g,
		"",
	);
	const cleanedQuery = withoutBlockComments.trim();

	if (cleanedQuery.length === 0) {
		return false;
	}

	// SQL must start with a primary keyword
	const sqlStartKeywords =
		/^\s*(select|insert|update|delete|create\s+table|create\s+view|drop|alter|truncate|merge|with)\b/i;
	if (sqlStartKeywords.test(cleanedQuery)) {
		// If it starts with SQL keyword, it's SQL (not plain text)
		return false;
	}

	// Check for natural language indicators
	const naturalLanguagePatterns = [
		/^(create|write|generate|make|build|get|find|show|give|fetch|retrieve)\s+(a|an|the|me|some)\s+(sql|query)/i,
		/^(can you|could you|please|i need|i want|how do i|help me)/i,
		/\b(query|sql|statement)\s+(for|to|that|which|where)\s/i,
	];

	if (naturalLanguagePatterns.some((pattern) => pattern.test(trimmedQuery))) {
		return true;
	}

	// Check for multiple sentences
	const sentences = trimmedQuery
		.split(/[.!?]+/)
		.filter((s) => s.trim().length > 0);
	if (sentences.length > 1) {
		return true;
	}

	// Check word density
	const commonWords =
		/\b(a|an|the|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|may|might|must|can|please|help|records?|data|information|about)\b/gi;
	const wordCount = trimmedQuery.split(/\s+/).length;
	const commonWordMatches = trimmedQuery.match(commonWords)?.length || 0;

	// If more than 40% are common English words, likely natural language
	if (wordCount > 5 && commonWordMatches / wordCount > 0.4) {
		return true;
	}

	// If none of the above, assume it's an attempt at SQL
	return false;
};

/**
 * Determine if the query is valid SQL (non-empty and not just comments)
 */
export const isQueryValid = (query: string): boolean => {
	if (!query.trim()) {
		return false;
	}

	// Remove all SQL comments
	const withoutLineComments = query.replace(/--.*$/gm, "");
	const withoutBlockComments = withoutLineComments.replace(
		/\/\*[\s\S]*?\*\//g,
		"",
	);
	const cleanedQuery = withoutBlockComments.trim();

	if (cleanedQuery.length === 0) {
		return false;
	}

	// If it's plain text description, it's not valid SQL
	if (isPlainText(query)) {
		return false;
	}

	// Must start with primary SQL keyword
	const sqlStartKeywords =
		/^\s*(select|insert|update|delete|create|drop|alter|truncate|merge|with)\b/i;
	return sqlStartKeywords.test(cleanedQuery);
};

export const SQLQueryEditorPanel = (props: SQLQueryEditorPanelProps) => {
	const {
		selectedDatabase,
		onDatabaseChange: _onDatabaseChange,
		userDatabases: _userDatabases,
		sqlQuery,
		onQueryChange,
		enableGenerate = false,
		generateMode = false,
		onGenerateModeToggle: _onGenerateModeToggle,
		selectedLLM,
		onLLMChange: _onLLMChange,
		userLLMs: _userLLMs,
		onGenerateSql,
		isGenerating = false,
		generatedSqlPending,
		onAcceptGeneratedSql,
		onBackToPrompt,
		showFrameConfig = false,
		frameType,
		onFrameTypeChange,
		frameVariableName,
		onFrameVariableNameChange,
		onSave,
		onCancel,
		onPreviewToggle,
		showPreview = false,
		editMode = false,
		editorRef,
		savedParameters: _savedParameters,
		customActions,
	} = props;

	const internalEditorRef = useRef<MonacoEditorInstance | null>(null);
	const effectiveEditorRef = editorRef || internalEditorRef;

	const handleEditorMount = (editor: MonacoEditorInstance) => {
		if (editorRef) {
			(
				editorRef as React.MutableRefObject<MonacoEditorInstance | null>
			).current = editor;
		} else {
			internalEditorRef.current = editor;
		}
		const lineCount = editor.getModel()?.getLineCount() || 10;
		const height = Math.max(300, lineCount * EDITOR_LINE_HEIGHT + 20);
		const width =
			effectiveEditorRef.current?.getLayoutInfo().width ||
			editor.getLayoutInfo().width;
		editor.layout({ width, height });
	};

	const handleClear = () => {
		const newQuery = generateMode
			? "Describe the data you want to retrieve in plain text."
			: "--SELECT * FROM...";
		onQueryChange(newQuery);
	};

	return (
		<div className="grid flex-1 grid-cols-[300px_1fr] gap-2 overflow-hidden">
			{/* Left: Database Columns Browser */}
			<div className="flex flex-col gap-1 overflow-y-auto border-border border-r pr-1 pl-1">
				<DatabaseAccordions
					databaseId={selectedDatabase}
					mode="query"
				/>
			</div>

			{/* Right: Editor Section */}
			<div className="flex flex-col gap-1 overflow-y-auto">
				{/* Header Actions */}
				<div className="flex flex-row items-center justify-between">
					<div className="flex flex-row items-center gap-1">
						<Button
							onClick={handleClear}
							size="sm"
							variant="outline"
						>
							<RefreshCw className="mr-1 size-4" />
							Clear
						</Button>
					</div>

					<div className="flex flex-row items-center gap-1">
						{/* Frame Configuration (optional) */}
						{showFrameConfig && frameType && onFrameTypeChange && (
							<div className="flex flex-row items-center gap-1">
								<Select
									value={frameType}
									onValueChange={(val) =>
										onFrameTypeChange(val)
									}
								>
									<SelectTrigger className="h-[30px] w-[140px]">
										<Maximize2 className="mr-1 size-4" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.values(DATA_FRAME_TYPES).map(
											(frame, i) => (
												<SelectItem
													key={`${i}-${frame.value}`}
													value={frame.value}
												>
													{frame.display}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								{frameVariableName !== undefined &&
									onFrameVariableNameChange && (
										<div className="relative">
											<Pencil className="-translate-y-1/2 absolute top-1/2 left-2 size-4 text-muted-foreground" />
											<Input
												title="Set Frame Variable Name"
												value={frameVariableName}
												placeholder="Frame Name"
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) =>
													onFrameVariableNameChange(
														e.target.value,
													)
												}
												className="h-[30px] w-[160px] pl-8"
											/>
										</div>
									)}
							</div>
						)}
					</div>
				</div>

				{/* Monaco Editor */}
				<div
					className={cn(
						"flex-1 overflow-hidden rounded border border-gray-300 transition-colors duration-300",
						generateMode ? "bg-blue-50" : "bg-white",
					)}
				>
					<Suspense fallback={<>Loading editor...</>}>
						<MonacoEditor
							value={generatedSqlPending || sqlQuery}
							language={
								generateMode && !generatedSqlPending
									? "plaintext"
									: "sql"
							}
							options={{
								scrollbar: { alwaysConsumeMouseWheel: false },
								readOnly: isGenerating,
								minimap: { enabled: false },
								automaticLayout: true,
								scrollBeyondLastLine: false,
								lineHeight: EDITOR_LINE_HEIGHT,
								overviewRulerBorder: false,
								lineNumbers: "on",
								glyphMargin: false,
								folding: true,
								lineNumbersMinChars: 2,
							}}
							onChange={(value) => onQueryChange(value || "")}
							onMount={handleEditorMount}
						/>
					</Suspense>
				</div>

				{/* Help Text */}
				{!generatedSqlPending && (
					<p className="mt-1 text-muted-foreground text-xs italic">
						{generateMode ? (
							<>
								<strong>Example:</strong> "Show all orders from
								last month with total greater than $1000"
							</>
						) : (
							<>
								<strong>Tip:</strong> Write your SQL query. Use
								Ctrl+Space for autocomplete suggestions.
							</>
						)}
					</p>
				)}

				{/* Generated SQL Info Banner */}
				{generatedSqlPending &&
					onAcceptGeneratedSql &&
					onBackToPrompt && (
						<div className="mt-1 flex flex-row items-center gap-1 rounded border border-blue-300 bg-blue-50 p-1.5">
							<Info className="size-5 text-primary" />
							<p className="flex-1 text-sm">
								Review the generated SQL. Fill in the frame type
								and name above, then save or click Back to edit
								your prompt.
							</p>
							<Button
								variant="outline"
								onClick={onBackToPrompt}
								size="sm"
							>
								<RefreshCw className="mr-1 size-4" />
								Back
							</Button>
							<Button
								onClick={onAcceptGeneratedSql}
								size="sm"
								disabled={
									showFrameConfig &&
									!frameVariableName?.trim()
								}
							>
								Save Query
							</Button>
						</div>
					)}

				{/* Action Buttons */}
				{customActions || (
					<div className="flex flex-row justify-end gap-1">
						{editMode && onCancel && (
							<Button variant="ghost" onClick={onCancel}>
								Cancel
							</Button>
						)}
						{enableGenerate && generateMode && onGenerateSql && (
							<Button
								onClick={onGenerateSql}
								disabled={
									!selectedDatabase ||
									!selectedLLM ||
									!sqlQuery.trim() ||
									isGenerating ||
									!!generatedSqlPending
								}
							>
								{isGenerating
									? "Generating..."
									: "Generate SQL from Description"}
							</Button>
						)}
						{onPreviewToggle && (
							<Button
								variant="outline"
								onClick={onPreviewToggle}
								disabled={
									!selectedDatabase ||
									(!isQueryValid(sqlQuery) &&
										!generatedSqlPending) ||
									hasParameterReferences(
										generatedSqlPending || sqlQuery,
									)
								}
							>
								{showPreview ? "Hide Preview" : "Show Preview"}
							</Button>
						)}
						{!generateMode && !generatedSqlPending && onSave && (
							<Button
								onClick={onSave}
								disabled={
									!selectedDatabase ||
									!isQueryValid(sqlQuery) ||
									(showFrameConfig &&
										!frameVariableName?.trim())
								}
							>
								{editMode ? "Update Query" : "Save Query"}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
