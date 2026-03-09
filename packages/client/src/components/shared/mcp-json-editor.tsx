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
	ThumbsDown,
	ThumbsUp,
	Trash2,
	X,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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

type MCPJsonEditorProps = {
	dataMap: {
		initialData: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path: string;
		name: string;
		enableToolEnhancer?: boolean;
		onOptimize?: (data: string) => Promise<string>;
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
	onOptimizeDescription: (
		toolIdx: number,
		propKey: string | null,
		currentDescription: string,
	) => void;
	enableToolEnhancer?: boolean;
}

interface OptimizationModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentDescription: string;
	optimizedDescription: string | null;
	onApprove: () => void;
	onReject: () => void;
	isLoading: boolean;
	error: string | null;
}

// Utility function to clean tool context by removing unwanted fields
const cleanToolContext = (tool: MCPTool): Omit<MCPTool, "_type" | "_meta"> => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { _type, _meta, ...cleanedTool } = tool;
	return cleanedTool;
};

// Custom hooks
const useDebounce = <T,>(value: T, delay: number = 400): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

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

// Optimization Modal Component
const OptimizationModal: React.FC<OptimizationModalProps> = ({
	isOpen,
	onClose,
	currentDescription,
	optimizedDescription,
	onApprove,
	onReject,
	isLoading,
	error,
}) => {
	if (!isOpen) return null;

	const handleApprove = () => {
		onApprove();
		onClose();
	};

	const handleReject = () => {
		onReject();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative mx-4 w-full max-w-3xl overflow-hidden rounded-lg bg-card shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-border border-b bg-secondary px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<div>
							<h2 className="font-semibold text-foreground text-lg">
								AI-Optimized Description
							</h2>
							<p className="text-muted-foreground text-sm">
								Review and approve the enhanced version
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
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
								Optimizing your description...
							</p>
							<p className="mt-2 text-muted-foreground text-sm">
								Our AI is analyzing and enhancing the content
							</p>
						</div>
					)}

					{error && !isLoading && (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
								<AlertCircle className="h-6 w-6 text-destructive" />
							</div>
							<p className="font-medium text-destructive">
								Optimization Failed
							</p>
							<p className="mt-2 text-center text-muted-foreground text-sm">
								{error}
							</p>
						</div>
					)}

					{!isLoading && !error && optimizedDescription && (
						<div className="space-y-6">
							{/* Original Description */}
							<div>
								<Label className="mb-2 flex items-center gap-2 text-foreground text-sm">
									<span>Original Description</span>
									<Badge
										variant="outline"
										className="text-xs"
									>
										Current
									</Badge>
								</Label>
								<div className="rounded-lg border border-border bg-muted p-4">
									<p className="text-muted-foreground text-sm leading-relaxed">
										{currentDescription || (
											<span className="italic">
												No description provided
											</span>
										)}
									</p>
								</div>
							</div>

							{/* Optimized Description */}
							<div>
								<Label className="mb-2 flex items-center gap-2 text-foreground text-sm">
									<span>AI-Optimized Description</span>
									<Badge color="success" className="text-xs">
										Enhanced
									</Badge>
								</Label>
								<div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
									<p className="text-foreground text-sm leading-relaxed">
										{optimizedDescription}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{!isLoading && !error && optimizedDescription && (
					<div className="flex items-center justify-between border-border border-t bg-secondary px-6 py-4">
						<Button
							variant="outline"
							onClick={handleReject}
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
						>
							<ThumbsDown size={16} />
							Reject
						</Button>
						<Button
							color="primary"
							onClick={handleApprove}
							className="flex items-center gap-2"
						>
							<ThumbsUp size={16} />
							Approve & Apply
						</Button>
					</div>
				)}

				{error && !isLoading && (
					<div className="flex items-center justify-end border-border border-t bg-secondary px-6 py-4">
						<Button variant="outline" onClick={onClose}>
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
		<div className="sticky top-0 z-50 mb-6 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur-sm">
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
							className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
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
							className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
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
					/>
					{searchQuery && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={onSearchClear}
								className="text-muted-foreground transition-colors hover:text-foreground"
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
		enableToolEnhancer = false,
	}) => {
		const handleHeaderClick = (e: React.MouseEvent) => {
			// Prevent toggle when clicking on delete/restore buttons
			if (
				(e.target as HTMLElement).closest(
					'button[data-action="delete"], button[data-action="restore"]',
				)
			) {
				return;
			}
			onToggleExpand(tool.name);
		};

		return (
			<Card className="mb-5 w-full gap-0 rounded-lg py-0 transition-all">
				<button
					type="button"
					onClick={handleHeaderClick}
					className={`flex w-full cursor-pointer items-center justify-between p-2 text-left ${
						isDeleted ? "bg-muted" : "bg-secondary"
					} ${
						isExpanded ? "rounded-t-lg" : "rounded-lg"
					} transition-colors hover:bg-accent`}
				>
					<div className="flex items-center gap-2">
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
					</div>
					<div className="flex gap-2">
						{!isDeleted && showDelete ? (
							<Button
								variant="ghost"
								size="sm"
								color="error"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(actualIdx);
								}}
								data-action="delete"
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
							>
								<Trash2 size={14} />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						) : isDeleted && showRestore ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									onRestore(actualIdx);
								}}
								data-action="restore"
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
							>
								<RotateCcw size={14} />
								<span className="hidden sm:inline">
									Restore
								</span>
							</Button>
						) : null}
					</div>
				</button>

				{isExpanded && (
					<div className="p-4">
						<div className="mb-3">
							<Label className="mb-1 block text-foreground text-sm">
								Description:
							</Label>
							<div className="relative">
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
									className={`w-full resize-y overflow-y-auto px-2 py-1 pr-10 text-foreground text-sm ${
										isDeleted
											? "cursor-not-allowed bg-muted opacity-60"
											: ""
									}`}
									placeholder="Describe function purpose and parameters..."
								/>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="absolute top-2 right-2 inline-flex">
											<Button
												hidden={window.location.hash.includes(
													"app",
												)}
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
														null,
														tool.description ?? "",
													)
												}
											>
												<Sparkles size={14} />
											</Button>
										</span>
									</TooltipTrigger>

									<TooltipContent>
										{enableToolEnhancer
											? "Generate AI-Optimized Description"
											: "Enable a text generation model in settings to unlock AI generated descriptions."}
									</TooltipContent>
								</Tooltip>
							</div>
						</div>

						<div className="w-full overflow-x-auto">
							<div
								className="min-w-full overflow-hidden rounded-lg border"
								style={{
									display: "grid",
									gridTemplateColumns:
										"10% 13% 28% 11% 10% 28%",
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
											<div className="flex w-full items-center border-border border-r border-b bg-card px-2 py-2">
												<div className="min-w-0 flex-1">
													<span
														className="block truncate text-foreground"
														title={k}
													>
														{k}
													</span>
												</div>
											</div>
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
												/>
											</div>
											<div className="border-border border-r border-b bg-card px-2 py-2">
												<div className="relative">
													<Textarea
														value={
															p.description ?? ""
														}
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
														style={{
															height: "3rem",
														}}
														className={`w-full resize-y overflow-y-auto px-1.5 py-1 pr-7 text-foreground text-xs ${
															isDeleted
																? "cursor-not-allowed bg-muted opacity-60"
																: ""
														}`}
														placeholder="Parameter description..."
													/>
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="absolute top-2 right-2 inline-flex">
																<Button
																	hidden={window.location.hash.includes(
																		"app",
																	)}
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
																			k,
																			p.description ??
																				"",
																		)
																	}
																>
																	<Sparkles
																		size={
																			12
																		}
																	/>
																</Button>
															</span>
														</TooltipTrigger>

														<TooltipContent>
															{enableToolEnhancer
																? "Generate AI-Optimized Description"
																: "Enable a text generation model in settings to unlock AI generated descriptions."}
														</TooltipContent>
													</Tooltip>
												</div>
											</div>
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
											<div className="flex items-center justify-center border-border border-r border-b bg-card px-2 py-2">
												<label className="flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														checked={isRequired}
														onChange={(e) =>
															onRequiredToggle(
																actualIdx,
																k,
																e.target
																	.checked,
															)
														}
														disabled={isDeleted}
														className={`h-4 w-4 rounded border border-border text-primary accent-primary focus:ring-2 focus:ring-ring ${
															isDeleted
																? "cursor-not-allowed opacity-60"
																: "cursor-pointer"
														}`}
													/>
													<span
														className={`text-xs ${
															isRequired
																? "font-semibold text-primary"
																: "text-muted-foreground"
														} ${
															isDeleted
																? "opacity-60"
																: ""
														}`}
													>
														{isRequired
															? "Required"
															: "Optional"}
													</span>
												</label>
											</div>
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
																? "border-destructive ring-destructive/20 focus:border-destructive"
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

// Main MCPJsonEditor Component
export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = ({ dataMap }) => {
	const { initialData, onSave, path, onOptimize, enableToolEnhancer } =
		dataMap;

	const [data, setData] = useState<MCPJsonData>(initialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		new Set<string>(
			initialData.tools && initialData.tools.length > 0
				? [initialData.tools[0].name]
				: [],
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
	// Optimization Modal State
	const [isOptimizationModalOpen, setIsOptimizationModalOpen] =
		useState(false);
	const [optimizationContext, setOptimizationContext] = useState<{
		toolIdx: number;
		propKey: string | null;
		currentDescription: string;
	} | null>(null);
	const [isOptimizationLoading, setIsOptimizationLoading] = useState(false);
	const [optimizedDescription, setOptimizedDescription] = useState<
		string | null
	>(null);
	const [optimizationError, setOptimizationError] = useState<string | null>(
		null,
	);

	const debouncedSearch = useDebounce(searchQuery, 400);
	const { jsonErrors, validateJson, clearError } = useJsonValidation();

	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

	useKeyboardShortcut("s", () => {
		if (hasChanges) {
			handleSave();
		}
	}, [hasChanges, data, deletedTools]);

	const updateTool = useCallback((index: number, value: Partial<MCPTool>) => {
		setData((d) => ({
			...d,
			tools: d.tools.map((t, i) =>
				i === index ? { ...t, ...value } : t,
			),
		}));
	}, []);

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
					if (i !== toolIdx) {
						return tool;
					}

					const currentRequired = tool.inputSchema.required || [];
					let newRequired: string[];

					if (isRequired) {
						if (!currentRequired.includes(propKey)) {
							newRequired = [...currentRequired, propKey];
						} else {
							newRequired = currentRequired;
						}
					} else {
						newRequired = currentRequired.filter(
							(key) => key !== propKey,
						);
					}

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
			setDeletedTools((prev) => {
				const toolName = data.tools[toolIdx].name;
				return [...prev, toolName];
			});
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
					const newValues = { ...prev };
					delete newValues[textKey];
					return newValues;
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
			if (propType === "number") {
				validDefault = Number(newDefault) || 0;
			} else if (propType === "boolean") {
				validDefault = newDefault === "true";
			}
			updateToolProp(toolIdx, propKey, { default: validDefault });
		},
		[updateToolProp],
	);

	const handleJsonTextChange = useCallback(
		(toolIdx: number, propKey: string, newText: string) => {
			const textKey = `${toolIdx}-${propKey}`;

			setJsonTextValues((prev) => ({
				...prev,
				[textKey]: newText,
			}));

			const result = validateJson(textKey, newText);
			if (result.valid) {
				try {
					const parsed = JSON.parse(newText);
					updateToolProp(toolIdx, propKey, { default: parsed });
				} catch {
					// Should not happen as validateJson already checked
				}
			}
		},
		[updateToolProp, validateJson],
	);

	const getJsonTextValue = useCallback(
		(toolIdx: number, propKey: string, defaultValue: unknown): string => {
			const textKey = `${toolIdx}-${propKey}`;

			if (jsonTextValues[textKey] !== undefined) {
				return jsonTextValues[textKey];
			}

			try {
				return JSON.stringify(defaultValue, null, 2);
			} catch {
				return "";
			}
		},
		[jsonTextValues],
	);

	// API call to GenerateEngineMetadata with cleaned context and dynamic system prompt
	const callGenerateEngineMetadataAPI = async (
		toolContext: MCPTool,
		propKey: string | null,
		propertyName?: string,
	): Promise<string> => {
		try {
			// Clean the tool context by removing _type
			const cleanedTool = cleanToolContext(toolContext);

			// Create the additional context string
			const additionalContext = JSON.stringify(cleanedTool, null, 2);

			// Generate dynamic system prompt based on context
			let systemPrompt = "";

			if (propKey === null) {
				// System prompt for tool's main description
				systemPrompt = `You are an expert technical writer specializing in API and tool documentation. Generate a comprehensive, clear, and professional description for this MCP (Model Context Protocol) tool. The description should:

				1. Explain the tool's primary purpose and functionality
				2. Highlight key capabilities and use cases
				3. Be concise yet informative (2-4 sentences)
				4. Use professional, neutral tone
				5. Focus on what the tool does, not implementation details

				Context: The tool is part of an MCP server configuration and will be used by AI assistants to understand when and how to use this tool.`;
			} else {
				// System prompt for individual property description
				systemPrompt = `You are an expert technical writer specializing in API parameter documentation. Generate a clear and precise description for the '${propertyName}' parameter of this MCP tool. The description should:

				1. Explain what this parameter represents and its purpose
				2. Clarify how it affects the tool's behavior
				3. Include expected format or value constraints if relevant
				4. Be concise (1-2 sentences)
				5. Use professional, neutral tone
				6. Focus on the parameter's role in the tool's operation

				Context: This parameter is part of an MCP tool's input schema and will help users understand what value to provide and why it's needed.`;
			}

			// Combine system prompt with additional context
			const contextWithPrompt = `${systemPrompt}\n\n=== TOOL CONTEXT ===\n${additionalContext}`;

			return onOptimize(JSON.stringify(contextWithPrompt));
		} catch (error) {
			console.error("Error calling GenerateEngineMetadata API:", error);
			throw new Error(
				"Failed to optimize description. Please try again.",
			);
		}
	};

	const handleOptimizeDescription = useCallback(
		async (
			toolIdx: number,
			propKey: string | null,
			currentDescription: string,
		) => {
			const tool = data.tools[toolIdx];

			setOptimizationContext({ toolIdx, propKey, currentDescription });
			setIsOptimizationModalOpen(true);
			setIsOptimizationLoading(true);
			setOptimizedDescription(null);
			setOptimizationError(null);

			try {
				// Pass property name for better context in system prompt
				const propertyName = propKey || undefined;

				// Call the GenerateEngineMetadata API with cleaned context
				const optimized = await callGenerateEngineMetadataAPI(
					tool,
					propKey,
					propertyName,
				);
				setOptimizedDescription(optimized);
			} catch (error) {
				console.error("Error optimizing description:", error);
				setOptimizationError(
					error instanceof Error
						? error.message
						: "Failed to optimize description. Please try again.",
				);
			} finally {
				setIsOptimizationLoading(false);
			}
		},
		[data.tools],
	);

	const handleApproveOptimization = useCallback(() => {
		if (!optimizationContext || !optimizedDescription) return;

		const { toolIdx, propKey } = optimizationContext;

		if (propKey === null) {
			// Update tool description
			updateTool(toolIdx, { description: optimizedDescription });
		} else {
			// Update property description
			updateToolProp(toolIdx, propKey, {
				description: optimizedDescription,
			});
		}

		setIsOptimizationModalOpen(false);
		setOptimizationContext(null);
		setOptimizedDescription(null);
	}, [optimizationContext, optimizedDescription, updateTool, updateToolProp]);

	const handleRejectOptimization = useCallback(() => {
		// Simply close the modal without applying changes
		console.log("User rejected the optimized description");
	}, []);

	const clearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	const toggleCardExpand = useCallback((toolName: string) => {
		setExpandedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(toolName)) {
				newSet.delete(toolName);
			} else {
				newSet.add(toolName);
			}
			return newSet;
		});
	}, []);

	const handleExpandAll = useCallback(() => {
		if (expandAll) {
			setExpandedCards(new Set());
			setExpandAll(false);
		} else {
			const allNames = new Set(
				data.tools
					.filter((t) => !deletedTools.includes(t.name))
					.map((t) => t.name),
			);
			setExpandedCards(allNames);
			setExpandAll(true);
		}
	}, [expandAll, data.tools, deletedTools]);

	const handleSave = useCallback(() => {
		if (hasChanges) {
			const updatedData = {
				...data,
				tools: data.tools.filter((t) => !deletedTools.includes(t.name)),
			};
			onSave?.(updatedData, path);

			setInitialDataSnapshot(JSON.stringify(updatedData));
			setDeletedTools([]);
			setData(updatedData);
		} else {
			onSave?.(data, path);
		}

		setHasChanges(false);
		// updatePanels(false);
	}, [hasChanges, data, deletedTools, onSave, path]);

	const visibleTools = useMemo(() => data.tools || [], [data.tools]);

	const filteredTools = useMemo(() => {
		if (!debouncedSearch.trim()) {
			return visibleTools;
		}
		const query = debouncedSearch.toLowerCase();
		return visibleTools.filter(
			(tool) =>
				tool.name.toLowerCase().includes(query) ||
				tool.title?.toLowerCase().includes(query) ||
				tool.description?.toLowerCase().includes(query),
		);
	}, [visibleTools, debouncedSearch]);

	const isCardExpanded = useCallback(
		(toolName: string) => {
			return expandedCards.has(toolName);
		},
		[expandedCards],
	);

	const isCardDeleted = useCallback(
		(toolName: string) => {
			return deletedTools.includes(toolName);
		},
		[deletedTools],
	);

	const headerText = useMemo(() => {
		return `${path.split("/").pop()?.replace(".json", "").toUpperCase()} JSON Editor`;
	}, [path]);

	return (
		<div className="container-padding-x mx-auto w-full max-w-full py-3">
			<div className="mb-6">
				<h2 className="heading-md">{headerText}</h2>
			</div>

			<EditorHeader
				functionCount={filteredTools.length}
				deletedCount={deletedTools.length}
				searchQuery={searchQuery}
				debouncedSearch={debouncedSearch}
				showExpandAll={true}
				showSave={true}
				showSearch={true}
				expandAll={expandAll}
				hasChanges={hasChanges}
				onExpandAll={handleExpandAll}
				onSave={handleSave}
				onSearchChange={setSearchQuery}
				onSearchClear={clearSearch}
			/>

			<Card className="mb-5 w-full rounded-lg bg-secondary p-4">
				<h3 className="font-semibold text-base text-foreground">
					Meta Data
				</h3>
				<div
					className="grid w-full gap-3"
					style={{
						gridTemplateColumns: `repeat(3, 1fr)`,
					}}
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

			{filteredTools.map((tool) => {
				const actualIdx = data.tools.findIndex(
					(t) => t.name === tool.name,
				);
				const isExpanded = isCardExpanded(tool.name);
				const isDeleted = isCardDeleted(tool.name);

				return (
					<FunctionCard
						key={tool.name}
						tool={tool}
						actualIdx={actualIdx}
						isExpanded={isExpanded}
						isDeleted={isDeleted}
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

			{/* Optimization Modal */}
			<OptimizationModal
				isOpen={isOptimizationModalOpen}
				onClose={() => {
					setIsOptimizationModalOpen(false);
					setOptimizationContext(null);
					setOptimizedDescription(null);
					setOptimizationError(null);
				}}
				currentDescription={
					optimizationContext?.currentDescription ?? ""
				}
				optimizedDescription={optimizedDescription}
				onApprove={handleApproveOptimization}
				onReject={handleRejectOptimization}
				isLoading={isOptimizationLoading}
				error={optimizationError}
			/>
		</div>
	);
};
