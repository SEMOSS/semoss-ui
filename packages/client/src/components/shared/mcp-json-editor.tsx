import {
	AlertCircle,
	Braces,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Copy,
	Maximize2,
	Minimize2,
	RotateCcw,
	Save,
	Search,
	Trash2,
	Wand2,
	X,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Switch,
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
	};
};

export type MCPToolProperty = {
	title: string;
	description?: string;
	type: string;
	default?: unknown;
	enum?: Array<string | number | boolean | null>;
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
	_meta?: Record<string, unknown>;
};

export type MCPJsonData = {
	_meta: Record<string, string>;
	tools: MCPTool[];
};

const ENUM_TYPE_VALUE = "enum";

const TYPE_OPTIONS = [
	{ value: "array", label: "Array" },
	{ value: "boolean", label: "Boolean" },
	{ value: ENUM_TYPE_VALUE, label: "Enum" },
	{ value: "number", label: "Number" },
	{ value: "object", label: "Object" },
	{ value: "string", label: "String" },
];

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
				if (!(key in prev)) return prev;
				const next = { ...prev };
				delete next[key];
				return next;
			});
			return { valid: true };
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : "Invalid JSON";
			setJsonErrors((prev) => ({ ...prev, [key]: errorMsg }));
			return { valid: false, error: errorMsg };
		}
	}, []);

	const clearError = useCallback((key: string) => {
		setJsonErrors((prev) => {
			if (!(key in prev)) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, callback, ...deps]);
};

const formatEnumValue = (value: string | number | boolean | null): string => {
	if (value === null) return "null";
	if (typeof value === "string") return `"${value}"`;
	return String(value);
};

const formatMetaKey = (key: string): string =>
	key
		.replace(/_(date|time|at|on)$/i, "")
		.replace(/_+/g, " ")
		.trim()
		.toLowerCase();

// JSON.parse error messages vary by engine. Try to extract line/col so the user
// can find the bad character without counting bytes by hand.
const locateJsonError = (
	message: string,
	text: string,
): { line: number; col: number } | null => {
	const lineColMatch = message.match(/line (\d+) column (\d+)/i);
	if (lineColMatch) {
		return { line: Number(lineColMatch[1]), col: Number(lineColMatch[2]) };
	}
	const posMatch = message.match(/position (\d+)/i);
	if (posMatch) {
		const pos = Math.min(Number(posMatch[1]), text.length);
		let line = 1;
		let col = 1;
		for (let i = 0; i < pos; i++) {
			if (text[i] === "\n") {
				line++;
				col = 1;
			} else {
				col++;
			}
		}
		return { line, col };
	}
	return null;
};

interface EditorHeaderProps {
	functionCount: number;
	deletedCount?: number;
	searchQuery: string;
	debouncedSearch?: string;
	showExpandAll?: boolean;
	showSave?: boolean;
	showSearch?: boolean;
	hasChanges?: boolean;
	onExpandAll?: () => void;
	onCollapseAll?: () => void;
	onSave?: () => void;
	onSearchChange: (value: string) => void;
	onSearchClear: () => void;
	saveShortcut?: string;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
	functionCount,
	deletedCount = 0,
	searchQuery,
	debouncedSearch = "",
	showExpandAll = true,
	showSave = true,
	showSearch = true,
	hasChanges = false,
	onExpandAll,
	onCollapseAll,
	onSave,
	onSearchChange,
	onSearchClear,
	saveShortcut = "Ctrl+S / Cmd+S",
}) => {
	return (
		<div className="sticky top-0 z-50 mb-6 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur-sm">
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
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon-sm"
									onClick={onExpandAll}
									aria-label="Expand all"
								>
									<Maximize2 size={14} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Expand all</TooltipContent>
						</Tooltip>
					)}
					{showExpandAll && onCollapseAll && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon-sm"
									onClick={onCollapseAll}
									aria-label="Collapse all"
								>
									<Minimize2 size={14} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Collapse all</TooltipContent>
						</Tooltip>
					)}
					{showSave && onSave && (
						<Button
							size="sm"
							color="primary"
							onClick={onSave}
							disabled={!hasChanges}
							title={saveShortcut}
							className="flex items-center gap-1.5"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					)}
				</div>
			</div>

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
								className="text-muted-foreground hover:text-foreground"
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

interface JsonFieldProps {
	value: string;
	error?: string;
	disabled?: boolean;
	emptyValue: string;
	placeholder: string;
	label?: React.ReactNode;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
	onChange: (text: string) => void;
}

const JsonField: React.FC<JsonFieldProps> = ({
	value,
	error,
	disabled,
	emptyValue,
	placeholder,
	label,
	collapsed,
	onToggleCollapse,
	onChange,
}) => {
	const [copied, setCopied] = useState(false);
	const safeValue = value ?? "";

	const errorLocation = useMemo(
		() => (error ? locateJsonError(error, safeValue) : null),
		[error, safeValue],
	);

	const handleFormat = useCallback(() => {
		try {
			const parsed = JSON.parse(safeValue);
			onChange(JSON.stringify(parsed, null, 2));
		} catch {
			// invalid JSON: leave as-is and let the error UI guide the user
		}
	}, [safeValue, onChange]);

	const handleReset = useCallback(() => {
		onChange(emptyValue);
	}, [emptyValue, onChange]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(safeValue);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			// clipboard blocked; ignore silently
		}
	}, [safeValue]);

	const isEmpty = safeValue.trim().length === 0;
	const hasError = Boolean(error);
	const lineCount = safeValue.length === 0 ? 1 : safeValue.split("\n").length;
	const rows = Math.max(1, Math.min(lineCount, 12));

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				{onToggleCollapse ? (
					<button
						type="button"
						onClick={onToggleCollapse}
						className="flex min-w-0 cursor-pointer items-center gap-2 text-left text-xs"
					>
						{collapsed ? (
							<ChevronDown
								size={16}
								className="text-muted-foreground"
							/>
						) : (
							<ChevronUp
								size={16}
								className="text-muted-foreground"
							/>
						)}
						{label && (
							<span className="truncate font-semibold text-foreground text-sm">
								{label}
							</span>
						)}
						<span className="flex items-center gap-1.5 text-muted-foreground">
							<Braces size={12} />
							<span className="font-medium">JSON</span>
						</span>
					</button>
				) : (
					<div className="flex min-w-0 items-center gap-2 text-xs">
						{label && (
							<span className="truncate font-semibold text-foreground text-sm">
								{label}
							</span>
						)}
						<span className="flex items-center gap-1.5 text-muted-foreground">
							<Braces size={12} />
							<span className="font-medium">JSON</span>
						</span>
					</div>
				)}
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={handleFormat}
								disabled={disabled || isEmpty || hasError}
								className="text-muted-foreground hover:text-foreground"
							>
								<Wand2 size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Format (pretty-print)</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={handleCopy}
								disabled={isEmpty}
								className="text-muted-foreground hover:text-foreground"
							>
								<Copy size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{copied ? "Copied" : "Copy"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={handleReset}
								disabled={disabled}
								className="text-muted-foreground hover:text-foreground"
							>
								<RotateCcw size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Reset to {emptyValue}</TooltipContent>
					</Tooltip>
				</div>
			</div>
			{!collapsed && (
				<>
					<Textarea
						value={safeValue}
						onChange={(e) => onChange(e.target.value)}
						disabled={disabled}
						rows={rows}
						spellCheck={false}
						placeholder={placeholder}
						style={{ minHeight: 0 }}
						className={`w-full resize-y px-2 py-1.5 font-mono text-foreground text-xs leading-relaxed ${
							hasError
								? "border-destructive ring-destructive/20 focus:border-destructive"
								: ""
						} ${disabled ? "cursor-not-allowed bg-muted opacity-60" : ""}`}
					/>
					<div className="min-h-[1rem] text-xs">
						{hasError ? (
							<div className="flex items-start gap-1 text-destructive">
								<AlertCircle
									size={12}
									className="mt-0.5 flex-shrink-0"
								/>
								<span>
									{errorLocation
										? `Line ${errorLocation.line}, column ${errorLocation.col}: ${error}`
										: error}
								</span>
							</div>
						) : isEmpty ? (
							<span className="text-muted-foreground">
								No default value
							</span>
						) : (
							<div className="flex items-center gap-1 text-[color:var(--chart-2)]">
								<CheckCircle2
									size={12}
									className="flex-shrink-0"
								/>
								<span>Valid JSON</span>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};

interface PropertyCardProps {
	toolIdx: number;
	propKey: string;
	property: MCPToolProperty;
	isRequired: boolean;
	isDeleted: boolean;
	jsonError?: string;
	jsonText: string;
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
	onEnumDefaultChange: (
		toolIdx: number,
		propKey: string,
		enumIndex: number,
	) => void;
	onEnumValueAdd: (
		toolIdx: number,
		propKey: string,
		newValue: string,
	) => void;
	onEnumValueDelete: (
		toolIdx: number,
		propKey: string,
		enumIndex: number,
	) => void;
	onJsonTextChange: (
		toolIdx: number,
		propKey: string,
		newText: string,
	) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
	toolIdx,
	propKey,
	property,
	isRequired,
	isDeleted,
	jsonError,
	jsonText,
	onUpdateToolProp,
	onRequiredToggle,
	onTypeChange,
	onDefaultChange,
	onEnumDefaultChange,
	onEnumValueAdd,
	onEnumValueDelete,
	onJsonTextChange,
}) => {
	const isEnumType = Array.isArray(property.enum);
	const enumOptions = isEnumType ? (property.enum ?? []) : [];
	const displayedType = isEnumType ? ENUM_TYPE_VALUE : property.type;
	const selectedEnumIndex = isEnumType
		? Math.max(
				enumOptions.indexOf(
					property.default as string | number | boolean | null,
				),
				0,
			)
		: -1;
	const isJsonType = property.type === "array" || property.type === "object";
	const requiredId = `required-${toolIdx}-${propKey}`;
	const [enumDraft, setEnumDraft] = useState("");

	const handleJsonChange = useCallback(
		(text: string) => onJsonTextChange(toolIdx, propKey, text),
		[onJsonTextChange, toolIdx, propKey],
	);

	const handleAddEnum = useCallback(() => {
		const trimmed = enumDraft.trim();
		if (!trimmed) return;
		if (enumOptions.some((opt) => String(opt) === trimmed)) {
			setEnumDraft("");
			return;
		}
		onEnumValueAdd(toolIdx, propKey, trimmed);
		setEnumDraft("");
	}, [enumDraft, enumOptions, onEnumValueAdd, toolIdx, propKey]);

	return (
		<div
			className={`rounded-lg border bg-card transition-colors ${
				isDeleted ? "opacity-60" : ""
			}`}
		>
			<div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-3 py-2">
				<code
					className="flex-1 truncate font-mono font-semibold text-foreground text-sm"
					title={propKey}
				>
					{propKey}
				</code>

				<div className="flex items-center gap-1.5">
					<Label className="text-muted-foreground text-xs">
						Type
					</Label>
					<Select
						value={displayedType}
						onValueChange={(val) =>
							onTypeChange(toolIdx, propKey, val)
						}
						disabled={isDeleted}
					>
						<SelectTrigger size="sm" className="h-8 w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TYPE_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<Label
						htmlFor={requiredId}
						className="text-muted-foreground text-xs"
					>
						Required
					</Label>
					<Switch
						id={requiredId}
						checked={isRequired}
						onCheckedChange={(checked) =>
							onRequiredToggle(toolIdx, propKey, checked)
						}
						disabled={isDeleted}
						size="sm"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-3 p-3">
				<div className="flex flex-col gap-1">
					<Label className="text-muted-foreground text-xs">
						Title
					</Label>
					<Input
						value={property.title}
						onChange={(e) =>
							onUpdateToolProp(toolIdx, propKey, {
								title: e.target.value,
							})
						}
						disabled={isDeleted}
						placeholder="Human-readable label"
						className={`text-foreground text-sm ${
							isDeleted
								? "cursor-not-allowed bg-muted opacity-60"
								: ""
						}`}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label className="text-muted-foreground text-xs">
						Description
					</Label>
					<Textarea
						value={property.description ?? ""}
						onChange={(e) =>
							onUpdateToolProp(toolIdx, propKey, {
								description: e.target.value,
							})
						}
						disabled={isDeleted}
						rows={3}
						placeholder="What this parameter controls..."
						className={`resize-y text-foreground text-sm ${
							isDeleted
								? "cursor-not-allowed bg-muted opacity-60"
								: ""
						}`}
					/>
				</div>

				{!isJsonType && (
					<div className="flex flex-col gap-1">
						<Label className="text-muted-foreground text-xs">
							Default value
						</Label>
						{isEnumType ? (
							enumOptions.length > 0 ? (
								<Select
									value={String(selectedEnumIndex)}
									onValueChange={(val) =>
										onEnumDefaultChange(
											toolIdx,
											propKey,
											Number(val),
										)
									}
									disabled={isDeleted}
								>
									<SelectTrigger size="sm" className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{enumOptions.map((option, index) => (
											<SelectItem
												key={`${propKey}-${String(option)}-${index}`}
												value={String(index)}
											>
												<span className="font-mono text-xs">
													{formatEnumValue(option)}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="text-muted-foreground text-xs">
									Add at least one allowed value below.
								</p>
							)
						) : property.type === "boolean" ? (
							<Select
								value={String(Boolean(property.default))}
								onValueChange={(val) =>
									onDefaultChange(
										toolIdx,
										propKey,
										val,
										property.type,
									)
								}
								disabled={isDeleted}
							>
								<SelectTrigger size="sm" className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="true">True</SelectItem>
									<SelectItem value="false">False</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<Input
								type={
									property.type === "number"
										? "number"
										: "text"
								}
								value={String(property.default ?? "")}
								onChange={(e) =>
									onDefaultChange(
										toolIdx,
										propKey,
										e.target.value,
										property.type,
									)
								}
								disabled={isDeleted}
								placeholder={
									property.type === "number"
										? "0"
										: "Default value"
								}
								className={`text-foreground text-sm ${
									isDeleted
										? "cursor-not-allowed bg-muted opacity-60"
										: ""
								}`}
							/>
						)}
					</div>
				)}

				{isEnumType && (
					<div className="flex flex-col gap-2">
						<Label className="text-muted-foreground text-xs">
							Allowed values ({enumOptions.length})
						</Label>
						{enumOptions.length > 0 ? (
							<div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
								{enumOptions.map((option, index) => (
									<span
										key={`${propKey}-${String(option)}-${index}`}
										className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-foreground text-xs"
										title={formatEnumValue(option)}
									>
										<span className="truncate">
											{formatEnumValue(option)}
										</span>
										<button
											type="button"
											onClick={() =>
												onEnumValueDelete(
													toolIdx,
													propKey,
													index,
												)
											}
											disabled={isDeleted}
											aria-label={`Remove ${String(option)}`}
											className="rounded text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
										>
											<X size={12} />
										</button>
									</span>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-xs">
								No values yet. Type below and press Enter to
								add.
							</p>
						)}
						<div className="flex items-center gap-2">
							<Input
								value={enumDraft}
								onChange={(e) => setEnumDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddEnum();
									}
								}}
								disabled={isDeleted}
								placeholder="Type a value and press Enter to add..."
								className={`text-foreground text-sm ${
									isDeleted
										? "cursor-not-allowed bg-muted opacity-60"
										: ""
								}`}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddEnum}
								disabled={isDeleted || !enumDraft.trim()}
							>
								Add
							</Button>
						</div>
					</div>
				)}

				{isJsonType && (
					<div className="flex flex-col gap-1">
						<Label className="text-muted-foreground text-xs">
							Default value
						</Label>
						<JsonField
							value={jsonText}
							error={jsonError}
							disabled={isDeleted}
							emptyValue={property.type === "array" ? "[]" : "{}"}
							placeholder={
								property.type === "array"
									? '["item1", "item2"]'
									: '{"key": "value"}'
							}
							onChange={handleJsonChange}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

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
	onEnumDefaultChange: (
		toolIdx: number,
		propKey: string,
		enumIndex: number,
	) => void;
	onEnumValueAdd: (
		toolIdx: number,
		propKey: string,
		newValue: string,
	) => void;
	onEnumValueDelete: (
		toolIdx: number,
		propKey: string,
		enumIndex: number,
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
}

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
		onEnumDefaultChange,
		onEnumValueAdd,
		onEnumValueDelete,
		onJsonTextChange,
		getJsonTextValue,
		jsonErrors,
		showDelete = true,
		showRestore = true,
	}) => {
		const propertyEntries = Object.entries(tool.inputSchema.properties);
		const requiredCount = tool.inputSchema.required?.length ?? 0;
		const [paramsExpanded, setParamsExpanded] = useState(true);
		const [metaExpanded, setMetaExpanded] = useState(false);

		const [metaText, setMetaText] = useState<string>(() => {
			if (!tool._meta || Object.keys(tool._meta).length === 0) return "";
			try {
				return JSON.stringify(tool._meta, null, 2);
			} catch {
				return "";
			}
		});
		const [metaError, setMetaError] = useState<string | undefined>(
			undefined,
		);

		const handleMetaChange = useCallback(
			(newText: string) => {
				setMetaText(newText);

				if (newText.trim() === "") {
					setMetaError(undefined);
					onUpdateTool(actualIdx, { _meta: undefined });
					return;
				}

				try {
					const parsed = JSON.parse(newText);
					if (
						typeof parsed !== "object" ||
						parsed === null ||
						Array.isArray(parsed)
					) {
						setMetaError("Metadata must be a JSON object");
						return;
					}
					setMetaError(undefined);
					onUpdateTool(actualIdx, {
						_meta: parsed as Record<string, unknown>,
					});
				} catch (e) {
					setMetaError(
						e instanceof Error ? e.message : "Invalid JSON",
					);
				}
			},
			[actualIdx, onUpdateTool],
		);

		return (
			<Card className="mb-4 w-full gap-0 overflow-hidden rounded-lg py-0">
				<div
					className={`flex w-full items-center justify-between ${
						isDeleted ? "bg-muted" : "bg-secondary"
					} transition-colors hover:bg-accent`}
				>
					<button
						type="button"
						onClick={() => onToggleExpand(tool.name)}
						className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 p-2 text-left sm:gap-2 sm:p-2.5"
					>
						<div className="flex-shrink-0 rounded p-1">
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
						<div className="flex min-w-0 flex-1 flex-col">
							<span
								className={`truncate font-semibold text-sm sm:text-base ${
									isDeleted
										? "text-muted-foreground line-through"
										: "text-foreground"
								}`}
							>
								{tool.title || tool.name}
							</span>
							{tool.title && tool.title !== tool.name && (
								<code className="truncate font-mono text-[10px] text-muted-foreground sm:text-xs">
									{tool.name}
								</code>
							)}
						</div>
						<div className="hidden flex-shrink-0 items-center gap-1.5 pr-2 text-muted-foreground text-xs sm:flex">
							<Badge variant="outline" className="text-xs">
								{propertyEntries.length}{" "}
								{propertyEntries.length === 1
									? "param"
									: "params"}
							</Badge>
							{requiredCount > 0 && (
								<Badge variant="outline" className="text-xs">
									{requiredCount} required
								</Badge>
							)}
						</div>
					</button>
					<div className="flex gap-2 pr-2">
						{!isDeleted && showDelete ? (
							<Button
								variant="ghost"
								size="sm"
								color="error"
								onClick={() => onDelete(actualIdx)}
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
								onClick={() => onRestore(actualIdx)}
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
				</div>

				{isExpanded && (
					<div className="space-y-4 p-4">
						<div className="flex flex-col gap-1">
							<Label className="text-muted-foreground text-xs">
								Function description
							</Label>
							<Textarea
								value={tool.description ?? ""}
								onChange={(e) =>
									onUpdateTool(actualIdx, {
										description: e.target.value,
									})
								}
								disabled={isDeleted}
								rows={2}
								className={`resize-y text-foreground text-sm ${
									isDeleted
										? "cursor-not-allowed bg-muted opacity-60"
										: ""
								}`}
								placeholder="Describe function purpose and when to use it..."
							/>
						</div>

						<Separator />

						<button
							type="button"
							onClick={() => setParamsExpanded((prev) => !prev)}
							className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
						>
							<div className="flex items-center gap-1.5">
								{paramsExpanded ? (
									<ChevronUp
										size={16}
										className="text-muted-foreground"
									/>
								) : (
									<ChevronDown
										size={16}
										className="text-muted-foreground"
									/>
								)}
								<Label className="cursor-pointer font-semibold text-foreground text-sm">
									Parameters
								</Label>
							</div>
							<span className="text-muted-foreground text-xs">
								{propertyEntries.length === 0
									? "No parameters"
									: `${propertyEntries.length} total · ${requiredCount} required`}
							</span>
						</button>

						{paramsExpanded &&
							(propertyEntries.length === 0 ? (
								<div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
									This function has no parameters.
								</div>
							) : (
								<div className="flex flex-col gap-3">
									{propertyEntries.map(([k, p]) => {
										const textKey = `${actualIdx}-${k}`;
										const isRequired =
											tool.inputSchema.required?.includes(
												k,
											) ?? false;

										return (
											<PropertyCard
												key={k}
												toolIdx={actualIdx}
												propKey={k}
												property={p}
												isRequired={isRequired}
												isDeleted={isDeleted}
												jsonError={jsonErrors[textKey]}
												jsonText={getJsonTextValue(
													actualIdx,
													k,
													p.default,
												)}
												onUpdateToolProp={
													onUpdateToolProp
												}
												onRequiredToggle={
													onRequiredToggle
												}
												onTypeChange={onTypeChange}
												onDefaultChange={
													onDefaultChange
												}
												onEnumDefaultChange={
													onEnumDefaultChange
												}
												onEnumValueAdd={onEnumValueAdd}
												onEnumValueDelete={
													onEnumValueDelete
												}
												onJsonTextChange={
													onJsonTextChange
												}
											/>
										);
									})}
								</div>
							))}

						<Separator />

						<JsonField
							label="Metadata"
							value={metaText}
							error={metaError}
							disabled={isDeleted}
							emptyValue="{}"
							placeholder={'{"annotation": "value"}'}
							collapsed={!metaExpanded}
							onToggleCollapse={() =>
								setMetaExpanded((prev) => !prev)
							}
							onChange={handleMetaChange}
						/>
					</div>
				)}
			</Card>
		);
	},
);

FunctionCard.displayName = "FunctionCard";

export const MCPJsonEditor: React.FC<MCPJsonEditorProps> = ({ dataMap }) => {
	const { initialData, onSave, path } = dataMap;

	const [data, setData] = useState<MCPJsonData>(initialData);
	const [deletedTools, setDeletedTools] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCards, setExpandedCards] = useState<Set<string>>(
		() => new Set<string>(),
	);
	const [jsonTextValues, setJsonTextValues] = useState<
		Record<string, string>
	>({});
	const [hasChanges, setHasChanges] = useState(false);
	const [initialDataSnapshot, setInitialDataSnapshot] = useState<string>(
		JSON.stringify(initialData),
	);

	const debouncedSearch = useDebounce(searchQuery, 400);
	const { jsonErrors, validateJson, clearError } = useJsonValidation();

	useEffect(() => {
		const currentSnapshot = JSON.stringify(data);
		const isModified =
			currentSnapshot !== initialDataSnapshot || deletedTools.length > 0;
		setHasChanges(isModified);
	}, [data, deletedTools, initialDataSnapshot]);

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
					if (i !== toolIdx) return tool;

					const currentRequired = tool.inputSchema.required || [];
					const newRequired = isRequired
						? currentRequired.includes(propKey)
							? currentRequired
							: [...currentRequired, propKey]
						: currentRequired.filter((key) => key !== propKey);

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
			const currentProperty =
				data.tools[toolIdx]?.inputSchema.properties[propKey];
			const currentEnum = Array.isArray(currentProperty?.enum)
				? currentProperty.enum
				: [];
			const textKey = `${toolIdx}-${propKey}`;

			if (newType === ENUM_TYPE_VALUE) {
				const enumValues = currentEnum.length > 0 ? currentEnum : [];
				const defaultFromEnum =
					enumValues.length > 0 &&
					enumValues.some(
						(option) => option === currentProperty?.default,
					)
						? currentProperty?.default
						: enumValues[0];

				updateToolProp(toolIdx, propKey, {
					type: "string",
					default: defaultFromEnum,
					enum: enumValues,
				});

				setJsonTextValues((prev) => {
					if (!(textKey in prev)) return prev;
					const next = { ...prev };
					delete next[textKey];
					return next;
				});
				clearError(textKey);
				return;
			}

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
				enum: undefined,
			});

			if (newType === "array" || newType === "object") {
				setJsonTextValues((prev) => ({
					...prev,
					[textKey]: JSON.stringify(newDefault, null, 2),
				}));
			} else {
				setJsonTextValues((prev) => {
					if (!(textKey in prev)) return prev;
					const next = { ...prev };
					delete next[textKey];
					return next;
				});
			}

			clearError(textKey);
		},
		[data.tools, updateToolProp, clearError],
	);

	const handleDefaultChange = useCallback(
		(
			toolIdx: number,
			propKey: string,
			newDefault: string,
			propType: string,
		) => {
			let validDefault: unknown = newDefault;
			if (propType === "number") {
				validDefault = Number(newDefault) || 0;
			} else if (propType === "boolean") {
				validDefault = newDefault === "true";
			}
			updateToolProp(toolIdx, propKey, { default: validDefault });
		},
		[updateToolProp],
	);

	const handleEnumDefaultChange = useCallback(
		(toolIdx: number, propKey: string, enumIndex: number) => {
			const enumValues =
				data.tools[toolIdx]?.inputSchema.properties[propKey]?.enum;
			if (!Array.isArray(enumValues) || enumValues.length === 0) return;

			const safeIndex = Math.min(
				Math.max(enumIndex, 0),
				enumValues.length - 1,
			);
			updateToolProp(toolIdx, propKey, {
				default: enumValues[safeIndex],
			});
		},
		[data.tools, updateToolProp],
	);

	const handleEnumValueAdd = useCallback(
		(toolIdx: number, propKey: string, newValue: string) => {
			const property =
				data.tools[toolIdx]?.inputSchema.properties[propKey];
			const current = Array.isArray(property?.enum) ? property.enum : [];
			if (current.some((v) => String(v) === newValue)) return;
			const nextEnum = [...current, newValue];
			const updates: Partial<MCPToolProperty> = { enum: nextEnum };
			// First value becomes the default if there isn't one yet.
			if (property?.default === undefined) {
				updates.default = newValue;
			}
			updateToolProp(toolIdx, propKey, updates);
		},
		[data.tools, updateToolProp],
	);

	const handleEnumValueDelete = useCallback(
		(toolIdx: number, propKey: string, enumIndex: number) => {
			const property =
				data.tools[toolIdx]?.inputSchema.properties[propKey];
			const current = Array.isArray(property?.enum) ? property.enum : [];
			if (enumIndex < 0 || enumIndex >= current.length) return;
			const removed = current[enumIndex];
			const nextEnum = current.filter((_, i) => i !== enumIndex);
			const updates: Partial<MCPToolProperty> = { enum: nextEnum };
			// If the deleted value was the default, point default at the first
			// remaining value (or drop default entirely if the list is empty).
			if (property?.default === removed) {
				updates.default = nextEnum[0];
			}
			updateToolProp(toolIdx, propKey, updates);
		},
		[data.tools, updateToolProp],
	);

	const handleJsonTextChange = useCallback(
		(toolIdx: number, propKey: string, newText: string) => {
			const textKey = `${toolIdx}-${propKey}`;

			setJsonTextValues((prev) => ({ ...prev, [textKey]: newText }));

			// Empty text means "no default value" — clear the error and drop
			// `default` from the property so it's omitted on serialize.
			if (newText.trim() === "") {
				clearError(textKey);
				updateToolProp(toolIdx, propKey, { default: undefined });
				return;
			}

			const result = validateJson(textKey, newText);
			if (result.valid) {
				try {
					const parsed = JSON.parse(newText);
					updateToolProp(toolIdx, propKey, { default: parsed });
				} catch {
					// already validated; unreachable
				}
			}
		},
		[updateToolProp, validateJson, clearError],
	);

	const getJsonTextValue = useCallback(
		(toolIdx: number, propKey: string, defaultValue: unknown): string => {
			const textKey = `${toolIdx}-${propKey}`;
			if (jsonTextValues[textKey] !== undefined) {
				return jsonTextValues[textKey];
			}
			if (defaultValue === undefined) return "";
			try {
				const serialized = JSON.stringify(defaultValue, null, 2);
				return serialized ?? "";
			} catch {
				return "";
			}
		},
		[jsonTextValues],
	);

	const clearSearch = useCallback(() => setSearchQuery(""), []);

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
		const allNames = new Set(
			data.tools
				.filter((t) => !deletedTools.includes(t.name))
				.map((t) => t.name),
		);
		setExpandedCards(allNames);
	}, [data.tools, deletedTools]);

	const handleCollapseAll = useCallback(() => {
		setExpandedCards(new Set());
	}, []);

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
	}, [hasChanges, data, deletedTools, onSave, path]);

	useKeyboardShortcut("s", () => {
		if (hasChanges) handleSave();
	}, [hasChanges, handleSave]);

	const visibleTools = useMemo(() => data.tools || [], [data.tools]);

	const filteredTools = useMemo(() => {
		if (!debouncedSearch.trim()) return visibleTools;
		const query = debouncedSearch.toLowerCase();
		return visibleTools.filter(
			(tool) =>
				tool.name.toLowerCase().includes(query) ||
				tool.title?.toLowerCase().includes(query) ||
				tool.description?.toLowerCase().includes(query),
		);
	}, [visibleTools, debouncedSearch]);

	const isCardExpanded = useCallback(
		(toolName: string) => expandedCards.has(toolName),
		[expandedCards],
	);

	const isCardDeleted = useCallback(
		(toolName: string) => deletedTools.includes(toolName),
		[deletedTools],
	);

	const headerText = useMemo(() => {
		return `${path.split("/").pop()?.replace(".json", "").toUpperCase()} JSON Editor`;
	}, [path]);

	const metaEntries = Object.entries(data._meta);

	return (
		<div className="container-padding-x mx-auto w-full max-w-full py-3">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
				<h2 className="heading-md">{headerText}</h2>
				{metaEntries.length > 0 && (
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
						{metaEntries.map(([key, value]) => (
							<div key={key} className="flex items-center gap-1">
								<span className="text-muted-foreground">
									{formatMetaKey(key)}:
								</span>
								<span className="font-medium text-foreground">
									{value}
								</span>
							</div>
						))}
					</div>
				)}
			</div>

			<EditorHeader
				functionCount={filteredTools.length}
				deletedCount={deletedTools.length}
				searchQuery={searchQuery}
				debouncedSearch={debouncedSearch}
				showExpandAll={true}
				showSave={true}
				showSearch={true}
				hasChanges={hasChanges}
				onExpandAll={handleExpandAll}
				onCollapseAll={handleCollapseAll}
				onSave={handleSave}
				onSearchChange={setSearchQuery}
				onSearchClear={clearSearch}
			/>

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
						onEnumDefaultChange={handleEnumDefaultChange}
						onEnumValueAdd={handleEnumValueAdd}
						onEnumValueDelete={handleEnumValueDelete}
						onJsonTextChange={handleJsonTextChange}
						getJsonTextValue={getJsonTextValue}
						jsonErrors={jsonErrors}
						showDelete={true}
						showRestore={true}
					/>
				);
			})}
		</div>
	);
};
