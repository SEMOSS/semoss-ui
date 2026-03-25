import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Loader2,
	Maximize2,
	Minimize2,
	RotateCcw,
	Save,
	Search,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	Label,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DescriptionDiff {
	old: string;
	new: string;
}

export interface MCPParameterDiff {
	name: string;
	old: string;
	new: string;
}

export interface MCPDescriptionApiResponse {
	tool_name: string;
	function_description: DescriptionDiff;
	parameters: MCPParameterDiff[];
}

interface DiffSelections {
	functionDescription: boolean;
	parameters: Record<string, boolean>;
}

type MCPJsonEditorProps = {
	dataMap: {
		initialData: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path: string;
		name: string;
		resourceId: string;
	};
};

export type MCPToolProperty = {
	title: string;
	description?: string;
	type: string;
	default?: unknown;
};

export type MCPTool = {
	name: string;
	title: string;
	description?: string;
	inputSchema: {
		properties: Record<string, MCPToolProperty>;
		required: string[];
		title: string;
		type: "object";
	};
	_type: string;
	_meta: Record<string, unknown>;
};

export type MCPJsonData = {
	_meta: Record<string, string>;
	tools: MCPTool[];
};

interface EditorHeaderProps {
	functionCount: number;
	deletedCount?: number;
	searchQuery: string;
	debouncedSearch?: string;
	showExpandAll?: boolean;
	showSave?: boolean;
	showSearch?: boolean;
	expandAll?: boolean;
	hasChanges?: boolean;
	onExpandAll?: () => void;
	onSave?: () => void;
	onSearchChange: (value: string) => void;
	onSearchClear: () => void;
	saveShortcut?: string;
}

interface FunctionCardProps {
	tool: MCPTool;
	actualIdx: number;
	isExpanded: boolean;
	isDeleted: boolean;
	onToggleExpand: (toolName: string) => void;
	onDelete: (idx: number) => void;
	onRestore: (idx: number) => void;
	onUpdateTool: (index: number, value: Partial<MCPTool>) => void;
	onUpdateToolProp: (
		toolIdx: number,
		propKey: string,
		changes: Partial<MCPToolProperty>,
	) => void;
	onRequiredToggle: (
		toolIdx: number,
		propKey: string,
		isRequired: boolean,
	) => void;
	onTypeChange: (toolIdx: number, propKey: string, newType: string) => void;
	onDefaultChange: (
		toolIdx: number,
		propKey: string,
		newDefault: string,
		propType: string,
	) => void;
	onJsonTextChange: (
		toolIdx: number,
		propKey: string,
		newText: string,
	) => void;
	getJsonTextValue: (
		toolIdx: number,
		propKey: string,
		defaultValue: unknown,
	) => string;
	jsonErrors: Record<string, string>;
	showDelete?: boolean;
	showRestore?: boolean;
	onOptimizeDescription: (toolIdx: number) => void;
	enableToolEnhancer: boolean;
}

interface DiffModalProps {
	isOpen: boolean;
	onClose: () => void;
	toolName: string;
	result: MCPDescriptionApiResponse | null;
	isLoading: boolean;
	error: string | null;
	onApply: (selections: DiffSelections) => void;
}

// Custom hooks
const useDebounce = <T,>(value: T, delay: number = 400): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debouncedValue;
};

const useJsonValidation = () => {
	const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

	const validateJson = useCallback((key: string, value: string) => {
		try {
			JSON.parse(value);
			setJsonErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[key];
				return newErrors;
			});
			return { valid: true };
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : "Invalid JSON";
			setJsonErrors((prev) => ({
				...prev,
				[key]: errorMsg,
			}));
			return { valid: false, error: errorMsg };
		}
	}, []);

	const clearError = useCallback((key: string) => {
		setJsonErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[key];
			return newErrors;
		});
	}, []);

	return { jsonErrors, validateJson, clearError };
};

const useKeyboardShortcut = (
	key: string,
	callback: () => void,
	deps: unknown[] = [],
) => {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === key) {
				e.preventDefault();
				callback();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [key, callback, ...deps]);
};

// ─── DiffRow Sub-Component ────────────────────────────────────────────────────

interface DiffRowProps {
	label: string;
	isToolLevel: boolean;
	diffData: DescriptionDiff;
	isSelected: boolean;
	onToggle: () => void;
}

const DiffRow: React.FC<DiffRowProps> = ({
	label,
	isToolLevel,
	diffData,
	isSelected,
	onToggle,
}) => {
	return (
		<div
			className={`rounded-lg border transition-all ${
				isSelected
					? "border-primary/40 bg-primary/5"
					: "border-border bg-card opacity-70"
			}`}
			data-testid={`diff-row-${label}`}
		>
			<div className="flex items-center gap-3 border-border border-b px-4 py-2">
				<input
					type="checkbox"
					checked={isSelected}
					onChange={onToggle}
					className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
					data-testid={`diff-row-checkbox-${label}`}
				/>
				{isToolLevel ? (
					<span className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
						<Sparkles size={13} className="text-primary" />
						{label}
					</span>
				) : (
					<span className="flex items-center gap-1.5 font-medium text-foreground text-sm">
						<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
							param
						</span>
						{label}
					</span>
				)}
			</div>
			<div className="grid grid-cols-2 divide-x divide-border">
				<div className="p-3">
					<p className="mb-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
						Current
					</p>
					<p className="text-muted-foreground text-sm leading-relaxed">
						{diffData.old ? (
							diffData.old
						) : (
							<span className="italic">No description</span>
						)}
					</p>
				</div>
				<div className="p-3">
					<p className="mb-1.5 font-medium text-primary text-xs uppercase tracking-wide">
						AI Generated
					</p>
					<p className="text-foreground text-sm leading-relaxed">
						{diffData.new ? (
							diffData.new
						) : (
							<span className="italic">No description</span>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};

// ─── Diff Modal Component ─────────────────────────────────────────────────────

const DiffModal: React.FC<DiffModalProps> = ({
	isOpen,
	onClose,
	toolName,
	result,
	isLoading,
	error,
	onApply,
}) => {
	const [selections, setSelections] = useState<DiffSelections>({
		functionDescription: true,
		parameters: {},
	});

	useEffect(() => {
		if (result) {
			const paramSelections: Record<string, boolean> = {};
			(result.parameters || []).forEach((p) => {
				paramSelections[p.name] = true;
			});
			setSelections({
				functionDescription: true,
				parameters: paramSelections,
			});
		}
	}, [result]);

	if (!isOpen) return null;

	const paramNames = (result?.parameters || []).map((p) => p.name);
	const allSelected =
		selections.functionDescription &&
		paramNames.every((n) => selections.parameters[n]);
	const anySelected =
		selections.functionDescription ||
		paramNames.some((n) => selections.parameters[n]);

	const handleToggleAll = () => {
		const next = !allSelected;
		const paramSelections: Record<string, boolean> = {};
		paramNames.forEach((n) => {
			paramSelections[n] = next;
		});
		setSelections({ functionDescription: next, parameters: paramSelections });
	};

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="diff-modal">
			<div className="relative mx-4 w-full max-w-4xl overflow-hidden rounded-lg bg-card shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-border border-b bg-secondary px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-foreground text-lg">
								AI Generated Descriptions
							</h2>
							<p className="text-muted-foreground text-sm">
								Review and select descriptions to apply for{" "}
								<span className="font-medium text-foreground">
									{toolName}
								</span>
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
						data-testid="diff-modal-close"
					>
						<X size={20} />
					</Button>
				</div>

				{/* Content */}
				<div className="max-h-[70vh] overflow-y-auto p-6">
					{isLoading && (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
							<p className="font-medium text-foreground">
								Generating descriptions...
							</p>
							<p className="mt-2 text-muted-foreground text-sm">
								AI is analyzing the tool and crafting optimized
								descriptions
							</p>
						</div>
					)}

					{error && !isLoading && (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
								<AlertCircle className="h-6 w-6 text-destructive" />
							</div>
							<p className="font-medium text-destructive">
								Generation Failed
							</p>
							<p className="mt-2 text-center text-muted-foreground text-sm">
								{error}
							</p>
						</div>
					)}

					{!isLoading && !error && result && (
						<div className="space-y-4">
							<div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2">
								<span className="text-muted-foreground text-sm">
									Select the descriptions you want to apply
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleToggleAll}
									className="text-primary hover:bg-primary/10"
									data-testid="diff-modal-toggle-all"
								>
									{allSelected ? "Deselect All" : "Select All"}
								</Button>
							</div>

							{result.function_description && (
								<DiffRow
									label="Function Description"
									isToolLevel={true}
									diffData={result.function_description}
									isSelected={selections.functionDescription}
									onToggle={() =>
										setSelections((prev) => ({
											...prev,
											functionDescription:
												!prev.functionDescription,
										}))
									}
								/>
							)}

							{(result.parameters || []).map((param) => (
								<DiffRow
									key={param.name}
									label={param.name}
									isToolLevel={false}
									diffData={{
										old: param.old,
										new: param.new,
									}}
									isSelected={
										selections.parameters[param.name] ??
										true
									}
									onToggle={() =>
										setSelections((prev) => ({
											...prev,
											parameters: {
												...prev.parameters,
												[param.name]:
													!prev.parameters[
														param.name
													],
											},
										}))
									}
								/>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				{!isLoading && !error && result && (
					<div className="flex items-center justify-between border-border border-t bg-secondary px-6 py-4">
						<Button
							variant="outline"
							onClick={onClose}
							className="text-muted-foreground hover:text-foreground"
							data-testid="diff-modal-cancel"
						>
							Cancel
						</Button>
						<Button
							color="primary"
							disabled={!anySelected}
							onClick={() => onApply(selections)}
							className="flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
							data-testid="diff-modal-apply"
						>
							<CheckCircle size={16} />
							Apply Selected
						</Button>
					</div>
				)}

				{error && !isLoading && (
					<div className="flex items-center justify-end border-border border-t bg-secondary px-6 py-4">
						<Button variant="outline" onClick={onClose} data-testid="diff-modal-error-close">
							Close
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

// EditorHeader Component
const EditorHeader: React.FC<EditorHeaderProps> = ({
	functionCount,
	deletedCount = 0,
	searchQuery,
	debouncedSearch = "",
	showExpandAll = true,
	showSave = true,
	showSearch = true,
	expandAll = false,
	hasChanges = false,
	onExpandAll,
	onSave,
	onSearchChange,
	onSearchClear,
	saveShortcut = "Ctrl+S / Cmd+S",
}) => {
	return (
		<div className="sticky top-0 z-50 mb-6 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur-sm" data-testid="editor-header">
			{/* Top Row: Function Count, Actions */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge color="info" className="px-2 py-1 text-xs">
						{functionCount}{" "}
						{functionCount === 1 ? "Function" : "Functions"}
					</Badge>
					{deletedCount > 0 && (
						<Badge color="error" className="px-2 py-1 text-xs">
							{deletedCount} Pending Deletion
						</Badge>
					)}
					{debouncedSearch && (
						<span className="text-muted-foreground text-xs">
							(filtered)
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{showExpandAll && onExpandAll && (
						<Button
							variant="outline"
							size="sm"
							onClick={onExpandAll}
							className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent"
							data-testid="editor-header-expand-all"
						>
							{expandAll ? (
								<Minimize2 size={14} />
							) : (
								<Maximize2 size={14} />
							)}
							<span className="hidden sm:inline">
								{expandAll ? "Collapse All" : "Expand All"}
							</span>
						</Button>
					)}
					{showSave && onSave && (
						<Button
							size="sm"
							color="primary"
							onClick={onSave}
							disabled={!hasChanges}
							title={saveShortcut}
							className="flex items-center gap-1.5 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
							data-testid="editor-header-save"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					)}
				</div>
			</div>
			{/* Search Bar */}
			{showSearch && (
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<Search
								size={18}
								className="text-muted-foreground"
							/>
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						value={searchQuery}
						onChange={(e) => onSearchChange?.(e.target.value)}
						placeholder="Search functions by name, title, or description..."
						className="text-foreground text-sm"
						data-testid="editor-header-search"
					/>
					{searchQuery && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={onSearchClear}
								className="text-muted-foreground transition-colors hover:text-foreground"
								data-testid="editor-header-search-clear"
							>
								<X size={18} />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			)}
		</div>
	);
};

// FunctionCard Component
const TYPE_OPTIONS = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "array", label: "Array" },
	{ value: "object", label: "Object" },
];

const FunctionCard = memo<FunctionCardProps>(
	({
		tool,
		actualIdx,
		isExpanded,
		isDeleted,
		onToggleExpand,
		onDelete,
		onRestore,
		onUpdateTool,
		onUpdateToolProp,
		onRequiredToggle,
		onTypeChange,
		onDefaultChange,
		onJsonTextChange,
		getJsonTextValue,
		jsonErrors,
		showDelete = true,
		showRestore = true,
		onOptimizeDescription,
		enableToolEnhancer,
	}) => {
		return (
			<Card className="mb-5 w-full gap-0 rounded-lg py-0 transition-all" data-testid={`function-card-${tool.name}`}>
				<div
					className={`flex w-full items-center justify-between ${
						isDeleted ? "bg-muted" : "bg-secondary"
					} ${
						isExpanded ? "rounded-t-lg" : "rounded-lg"
					} transition-colors hover:bg-accent`}
				>
					<button
						type="button"
						onClick={() => onToggleExpand(tool.name)}
						className="flex flex-1 cursor-pointer items-center gap-2 p-2 text-left"
						data-testid={`function-card-toggle-${tool.name}`}
					>
						<div className="rounded p-1">
							{isExpanded ? (
								<ChevronUp
									size={18}
									className="text-muted-foreground"
								/>
							) : (
								<ChevronDown
									size={18}
									className="text-muted-foreground"
								/>
							)}
						</div>
						<span
							className={`font-bold text-base ${
								isDeleted
									? "text-muted-foreground line-through"
									: "text-foreground"
							}`}
						>
							{tool.title || tool.name}
						</span>
					</button>
					<div className="flex gap-2 pr-2">
						{!isDeleted && showDelete ? (
							<Button
								variant="ghost"
								size="sm"
								color="error"
								onClick={() => onDelete(actualIdx)}
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
								data-testid={`function-card-delete-${tool.name}`}
							>
								<Trash2 size={14} />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						) : isDeleted && showRestore ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onRestore(actualIdx)}
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
								data-testid={`function-card-restore-${tool.name}`}
							>
								<RotateCcw size={14} />
								<span className="hidden sm:inline">Restore</span>
							</Button>
						) : null}
					</div>
				</div>

				{isExpanded && (
					<div className="p-4">
						<div className="mb-3">
							<div className="mb-1 flex items-center justify-between">
								<Label className="text-foreground text-sm">
									Description:
								</Label>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex">
											<Button
												disabled={
													isDeleted ||
													!enableToolEnhancer
												}
												variant="ghost"
												size="icon-sm"
												className="h-6 w-6 text-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
												onClick={() =>
													onOptimizeDescription(
														actualIdx,
													)
												}
												data-testid={`function-card-optimize-${tool.name}`}
											>
												<Sparkles size={14} />
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent>
										{enableToolEnhancer
											? "Generate AI descriptions for this tool and all its parameters"
											: "Enable a text generation model in settings to unlock AI generated descriptions."}
									</TooltipContent>
								</Tooltip>
							</div>
							<Textarea
								value={tool.description ?? ""}
								onChange={(e) =>
									onUpdateTool(actualIdx, {
										description: e.target.value,
									})
								}
								disabled={isDeleted}
								rows={2}
								style={{ height: "4rem" }}
								className={`w-full resize-y overflow-y-auto px-2 py-1 text-foreground text-sm ${
									isDeleted
										? "cursor-not-allowed bg-muted opacity-60"
										: ""
								}`}
								placeholder="Describe function purpose and parameters..."
								data-testid={`function-card-description-${tool.name}`}
							/>
						</div>

						{/* Properties Grid */}
						<div className="w-full overflow-x-auto">
							<div
								className="min-w-full overflow-hidden rounded-lg border"
								style={{
									display: "grid",
									gridTemplateColumns:
										"10% 13% 27% 12% 12% 26%",
									fontSize: "0.813rem",
								}}
							>
								{/* Header Row */}
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Name
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Title
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Description
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Type
								</div>
								<div className="flex items-center justify-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Required
								</div>
								<div className="flex items-center border-border border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Default Value
								</div>

								{/* Data Rows */}
								{Object.entries(
									tool.inputSchema.properties,
								).map(([k, p]) => {
									const textKey = `${actualIdx}-${k}`;
									const hasError = jsonErrors[textKey];
									const isRequired =
										tool.inputSchema.required?.includes(
											k,
										) || false;

									return (
										<React.Fragment key={k}>
											{/* Name */}
											<div className="flex w-full items-center border-border border-r border-b bg-card px-2 py-2">
												<span
													className="block truncate text-foreground"
													title={k}
												>
													{k}
												</span>
											</div>

											{/* Title */}
											<div className="flex items-center border-border border-r border-b bg-card px-2 py-2">
												<Input
													value={p.title}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																title: e.target
																	.value,
															},
														)
													}
													disabled={isDeleted}
													className={`w-full px-1.5 py-1 text-foreground text-sm ${
														isDeleted
															? "cursor-not-allowed bg-muted opacity-60"
															: ""
													}`}
													data-testid={`prop-title-${tool.name}-${k}`}
												/>
											</div>

											{/* Description */}
											<div className="border-border border-r border-b bg-card px-2 py-2">
												<Textarea
													value={p.description ?? ""}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																description:
																	e.target
																		.value,
															},
														)
													}
													disabled={isDeleted}
													rows={2}
													style={{ height: "3rem" }}
													className={`w-full resize-y overflow-y-auto px-1.5 py-1 text-foreground text-xs ${
														isDeleted
															? "cursor-not-allowed bg-muted opacity-60"
															: ""
													}`}
													placeholder="Parameter description..."
													data-testid={`prop-description-${tool.name}-${k}`}
												/>
											</div>

											{/* Type */}
											<div className="flex items-center border-border border-r border-b bg-card px-2 py-2">
												<select
													value={p.type}
													onChange={(e) =>
														onTypeChange(
															actualIdx,
															k,
															e.target.value,
														)
													}
													disabled={isDeleted}
													className={`h-[34px] w-full rounded border border-border bg-card px-1.5 text-foreground text-sm ${
														isDeleted
															? "cursor-not-allowed opacity-60"
															: ""
													}`}
													data-testid={`prop-type-${tool.name}-${k}`}
												>
													{TYPE_OPTIONS.map((opt) => (
														<option
															key={opt.value}
															value={opt.value}
														>
															{opt.label}
														</option>
													))}
												</select>
											</div>

											{/* Required */}
											<div className="flex items-center justify-center border-border border-r border-b bg-card px-2 py-2">
												<input
													type="checkbox"
													checked={isRequired}
													onChange={(e) =>
														onRequiredToggle(
															actualIdx,
															k,
															e.target.checked,
														)
													}
													disabled={isDeleted}
													title={
														isRequired
															? "Required"
															: "Optional"
													}
													className={`h-4 w-4 rounded border-border accent-primary ${
														isDeleted
															? "cursor-not-allowed opacity-60"
															: "cursor-pointer"
													}`}
													data-testid={`prop-required-${tool.name}-${k}`}
												/>
											</div>

											{/* Default Value */}
											{p.type === "array" ||
											p.type === "object" ? (
												<div className="border-border border-b bg-card px-2 py-2">
													<Textarea
														value={getJsonTextValue(
															actualIdx,
															k,
															p.default,
														)}
														onChange={(e) =>
															onJsonTextChange(
																actualIdx,
																k,
																e.target.value,
															)
														}
														disabled={isDeleted}
														rows={3}
														style={{
															height: "4.5rem",
														}}
														className={`w-full resize-y overflow-y-auto px-1.5 py-1 font-mono text-foreground text-xs ${
															hasError
																? "border-destructive"
																: "border-border"
														} ${
															isDeleted
																? "cursor-not-allowed bg-muted opacity-60"
																: ""
														}`}
														placeholder={
															p.type === "array"
																? '["item1", "item2"]'
																: '{"key": "value"}'
														}
														data-testid={`prop-default-${tool.name}-${k}`}
													/>
													{hasError && (
														<div className="mt-1 flex items-start gap-1 text-destructive text-xs">
															<AlertCircle
																size={12}
																className="mt-0.5 flex-shrink-0"
															/>
															<span>
																{hasError}
															</span>
														</div>
													)}
													{!hasError &&
														p.default !==
															undefined && (
															<div className="mt-1 flex items-center gap-1 text-[color:var(--chart-2)] text-xs">
																<CheckCircle
																	size={12}
																	className="flex-shrink-0"
																/>
																<span>
																	Valid JSON
																</span>
															</div>
														)}
												</div>
											) : (
												<div className="flex items-center border-border border-b bg-card px-2 py-2">
													{p.type === "boolean" ? (
														<select
															value={String(
																p.default,
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`h-[34px] w-full rounded border border-border bg-card px-1.5 text-foreground text-sm ${
																isDeleted
																	? "cursor-not-allowed opacity-60"
																	: ""
															}`}
															data-testid={`prop-default-${tool.name}-${k}`}
														>
															<option value="true">
																True
															</option>
															<option value="false">
																False
															</option>
														</select>
													) : (
														<Input
															type={
																p.type ===
																"number"
																	? "number"
																	: "text"
															}
															value={String(
																p.default ?? "",
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`w-full px-1.5 py-1 text-foreground text-sm ${
																isDeleted
																	? "cursor-not-allowed bg-muted opacity-60"
																	: ""
															}`}
															data-testid={`prop-default-${tool.name}-${k}`}
														/>
													)}
												</div>
											)}
										</React.Fragment>
									);
								})}
							</div>
						</div>
					</div>
				)}
			</Card>
		);
	},
);

FunctionCard.displayName = "FunctionCard";

// ─── Main MCPJsonEditor Component ─────────────────────────────────────────────

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = ({ dataMap }) => {
	const { initialData, onSave, path, resourceId } = dataMap;
	const insight = useInsight();
	const {insightStore} = useRootStore();
	const modelId = insightStore.defaultTextGenerationModel;
	const enableToolEnhancer = !!modelId;
	const [data, setData] = useState<MCPJsonData>(initialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		new Set<string>(
			initialData.tools?.length > 0 ? [initialData.tools[0].name] : [],
		),
	);
	const [expandAll, setExpandAll] = useState(false);
	const [jsonTextValues, setJsonTextValues] = useState<
		Record<string, string>
	>({});
	const [hasChanges, setHasChanges] = useState(false);
	const [initialDataSnapshot, setInitialDataSnapshot] = useState<string>(
		JSON.stringify(initialData),
	);

	// ── Diff Modal State ───────────────────────────────────────────────────────
	const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
	const [diffToolIdx, setDiffToolIdx] = useState<number | null>(null);
	const [isDiffLoading, setIsDiffLoading] = useState(false);
	const [diffResult, setDiffResult] =
		useState<MCPDescriptionApiResponse | null>(null);
	const [diffError, setDiffError] = useState<string | null>(null);

	const debouncedSearch = useDebounce(searchQuery, 400);
	const { jsonErrors, validateJson, clearError } = useJsonValidation();

	// ── Change tracking ────────────────────────────────────────────────────────
	useEffect(() => {
		const isModified =
			JSON.stringify(data) !== initialDataSnapshot ||
			deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	useKeyboardShortcut(
		"s",
		() => {
			if (hasChanges) handleSave();
		},
		[hasChanges, data, deletedTools],
	);

	// ── Tool / Property updaters ───────────────────────────────────────────────
	const updateTool = useCallback(
		(index: number, value: Partial<MCPTool>) => {
			setData((d) => ({
				...d,
				tools: d.tools.map((t, i) =>
					i === index ? { ...t, ...value } : t,
				),
			}));
		},
		[],
	);

	const updateToolProp = useCallback(
		(
			toolIdx: number,
			propKey: string,
			changes: Partial<MCPToolProperty>,
		) => {
			setData((d) => ({
				...d,
				tools: d.tools.map((tool, i) =>
					i !== toolIdx
						? tool
						: {
								...tool,
								inputSchema: {
									...tool.inputSchema,
									properties: {
										...tool.inputSchema.properties,
										[propKey]: {
											...tool.inputSchema.properties[
												propKey
											],
											...changes,
										},
									},
								},
							},
				),
			}));
		},
		[],
	);

	const handleRequiredToggle = useCallback(
		(toolIdx: number, propKey: string, isRequired: boolean) => {
			setData((d) => ({
				...d,
				tools: d.tools.map((tool, i) => {
					if (i !== toolIdx) return tool;
					const current = tool.inputSchema.required || [];
					const newRequired = isRequired
						? current.includes(propKey)
							? current
							: [...current, propKey]
						: current.filter((k) => k !== propKey);
					return {
						...tool,
						inputSchema: {
							...tool.inputSchema,
							required: newRequired,
						},
					};
				}),
			}));
		},
		[],
	);

	const handleToolDelete = useCallback(
		(toolIdx: number) => {
			setDeletedTools((prev) => [...prev, data.tools[toolIdx].name]);
		},
		[data.tools],
	);

	const handleToolRestore = useCallback(
		(toolIdx: number) => {
			setDeletedTools((prev) =>
				prev.filter((name) => name !== data.tools[toolIdx].name),
			);
		},
		[data.tools],
	);

	const handleTypeChange = useCallback(
		(toolIdx: number, propKey: string, newType: string) => {
			const newDefault =
				newType === "number"
					? 0
					: newType === "boolean"
						? false
						: newType === "array"
							? []
							: newType === "object"
								? {}
								: "";
			updateToolProp(toolIdx, propKey, {
				type: newType,
				default: newDefault,
			});
			const textKey = `${toolIdx}-${propKey}`;
			if (newType === "array" || newType === "object") {
				setJsonTextValues((prev) => ({
					...prev,
					[textKey]: JSON.stringify(newDefault, null, 2),
				}));
			} else {
				setJsonTextValues((prev) => {
					const next = { ...prev };
					delete next[textKey];
					return next;
				});
			}
			clearError(textKey);
		},
		[updateToolProp, clearError],
	);

	const handleDefaultChange = useCallback(
		(
			toolIdx: number,
			propKey: string,
			newDefault: string,
			propType: string,
		) => {
			let validDefault: string | number | boolean = newDefault;
			if (propType === "number") validDefault = Number(newDefault) || 0;
			else if (propType === "boolean")
				validDefault = newDefault === "true";
			updateToolProp(toolIdx, propKey, { default: validDefault });
		},
		[updateToolProp],
	);

	const handleJsonTextChange = useCallback(
		(toolIdx: number, propKey: string, newText: string) => {
			const textKey = `${toolIdx}-${propKey}`;
			setJsonTextValues((prev) => ({ ...prev, [textKey]: newText }));
			const result = validateJson(textKey, newText);
			if (result.valid) {
				try {
					updateToolProp(toolIdx, propKey, {
						default: JSON.parse(newText),
					});
				} catch {
					// noop
				}
			}
		},
		[updateToolProp, validateJson],
	);

	const getJsonTextValue = useCallback(
		(toolIdx: number, propKey: string, defaultValue: unknown): string => {
			const textKey = `${toolIdx}-${propKey}`;
			if (jsonTextValues[textKey] !== undefined)
				return jsonTextValues[textKey];
			try {
				return JSON.stringify(defaultValue, null, 2);
			} catch {
				return "";
			}
		},
		[jsonTextValues],
	);

	const handleOptimizeDescription = useCallback(
		async (toolIdx: number) => {
			if (!modelId) return;

			const tool = data.tools[toolIdx];
			setDiffToolIdx(toolIdx);
			setIsDiffModalOpen(true);
			setIsDiffLoading(true);
			setDiffResult(null);
			setDiffError(null);
			const resourceType = window.location.hash.includes('app')? "project" : "engine";
			try {
				const pixelCommand = `GenerateDescriptionForMcp(${resourceType}=["${resourceId}"], model=["${modelId}"], toolName="${tool.name}");`;
				const { pixelReturn } = await insight.actions.run(pixelCommand);
				setDiffResult(pixelReturn[0].output as MCPDescriptionApiResponse);
			} catch (err) {
				setDiffError(
					err instanceof Error
						? err.message
						: "Failed to generate descriptions. Please try again.",
				);
			} finally {
				setIsDiffLoading(false);
			}
		},
		[data.tools, resourceId, modelId, insight.actions],
	);

	// ── Apply selected diff fields ─────────────────────────────────────────────
	const handleApplyDiff = useCallback(
		(selections: DiffSelections) => {
			if (diffToolIdx === null || !diffResult) return;

			if (
				selections.functionDescription &&
				diffResult.function_description?.new
			) {
				updateTool(diffToolIdx, {
					description: diffResult.function_description.new,
				});
			}

			(diffResult.parameters || []).forEach((param) => {
				if (selections.parameters[param.name] && param.new) {
					updateToolProp(diffToolIdx, param.name, {
						description: param.new,
					});
				}
			});

			setIsDiffModalOpen(false);
			setDiffToolIdx(null);
			setDiffResult(null);
		},
		[diffToolIdx, diffResult, updateTool, updateToolProp],
	);

	const closeDiffModal = useCallback(() => {
		setIsDiffModalOpen(false);
		setDiffToolIdx(null);
		setDiffResult(null);
		setDiffError(null);
	}, []);

	// ── Search / expand helpers ────────────────────────────────────────────────
	const clearSearch = useCallback(() => setSearchQuery(""), []);

	const toggleCardExpand = useCallback((toolName: string) => {
		setExpandedCards((prev) => {
			const next = new Set(prev);
			next.has(toolName) ? next.delete(toolName) : next.add(toolName);
			return next;
		});
	}, []);

	const handleExpandAll = useCallback(() => {
		if (expandAll) {
			setExpandedCards(new Set());
			setExpandAll(false);
		} else {
			setExpandedCards(
				new Set(
					data.tools
						.filter((t) => !deletedTools.includes(t.name))
						.map((t) => t.name),
				),
			);
			setExpandAll(true);
		}
	}, [expandAll, data.tools, deletedTools]);

	// ── Save ───────────────────────────────────────────────────────────────────
	const handleSave = useCallback(() => {
		if (hasChanges) {
			const updatedData = {
				...data,
				tools: data.tools.filter(
					(t) => !deletedTools.includes(t.name),
				),
			};
			onSave?.(updatedData, path);
			setInitialDataSnapshot(JSON.stringify(updatedData));
			setDeletedTools([]);
			setData(updatedData);
		} else {
			onSave?.(data, path);
		}
		setHasChanges(false);
	}, [hasChanges, data, deletedTools, onSave, path]);

	// ── Memos ──────────────────────────────────────────────────────────────────
	const visibleTools = useMemo(() => data.tools || [], [data.tools]);

	const filteredTools = useMemo(() => {
		if (!debouncedSearch.trim()) return visibleTools;
		const q = debouncedSearch.toLowerCase();
		return visibleTools.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.title?.toLowerCase().includes(q) ||
				t.description?.toLowerCase().includes(q),
		);
	}, [visibleTools, debouncedSearch]);

	const headerText = useMemo(
		() =>
			`${path
				.split("/")
				.pop()
				?.replace(".json", "")
				.toUpperCase()} JSON Editor`,
		[path],
	);

	const activeDiffTool =
		diffToolIdx !== null ? data.tools[diffToolIdx] : null;

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<div className="container-padding-x mx-auto w-full max-w-full py-3" data-testid="mcp-json-editor">
			<div className="mb-6">
				<h2 className="heading-md">{headerText}</h2>
			</div>

			<EditorHeader
				functionCount={filteredTools.length}
				deletedCount={deletedTools.length}
				searchQuery={searchQuery}
				debouncedSearch={debouncedSearch}
				expandAll={expandAll}
				hasChanges={hasChanges}
				onExpandAll={handleExpandAll}
				onSave={handleSave}
				onSearchChange={setSearchQuery}
				onSearchClear={clearSearch}
			/>

			{/* Meta Section */}
			<Card className="mb-5 w-full rounded-lg bg-secondary p-4">
				<h3 className="mb-3 font-semibold text-base text-foreground">
					Meta Data
				</h3>
				<div
					className="grid w-full gap-3"
					style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
				>
					{Object.entries(data._meta).map(([key, value]) => (
						<div key={key} className="flex flex-col gap-1">
							<Label
								htmlFor={key}
								className="text-muted-foreground text-sm"
							>
								{key}
							</Label>
							<Input
								id={key}
								value={value}
								readOnly
								disabled
								className="w-full cursor-not-allowed border-input bg-muted px-2 py-1 text-muted-foreground text-sm"
							/>
						</div>
					))}
				</div>
			</Card>

			{/* Empty state */}
			{filteredTools.length === 0 && (
				<div className="py-12 text-center">
					<Search
						className="mx-auto mb-3 text-muted-foreground"
						size={48}
					/>
					<p className="text-base text-muted-foreground">
						{debouncedSearch
							? `No functions found matching "${debouncedSearch}"`
							: "No functions found."}
					</p>
				</div>
			)}

			{/* Tool Cards */}
			{filteredTools.map((tool) => {
				const actualIdx = data.tools.findIndex(
					(t) => t.name === tool.name,
				);
				return (
					<FunctionCard
						key={tool.name}
						tool={tool}
						actualIdx={actualIdx}
						isExpanded={expandedCards.has(tool.name)}
						isDeleted={deletedTools.includes(tool.name)}
						onToggleExpand={toggleCardExpand}
						onDelete={handleToolDelete}
						onRestore={handleToolRestore}
						onUpdateTool={updateTool}
						onUpdateToolProp={updateToolProp}
						onRequiredToggle={handleRequiredToggle}
						onTypeChange={handleTypeChange}
						onDefaultChange={handleDefaultChange}
						onJsonTextChange={handleJsonTextChange}
						getJsonTextValue={getJsonTextValue}
						jsonErrors={jsonErrors}
						showDelete={true}
						showRestore={true}
						onOptimizeDescription={handleOptimizeDescription}
						enableToolEnhancer={enableToolEnhancer}
					/>
				);
			})}

			{/* Diff Modal */}
			<DiffModal
				isOpen={isDiffModalOpen}
				onClose={closeDiffModal}
				toolName={activeDiffTool?.title || activeDiffTool?.name || ""}
				result={diffResult}
				isLoading={isDiffLoading}
				error={diffError}
				onApply={handleApplyDiff}
			/>
		</div>
	);
};
