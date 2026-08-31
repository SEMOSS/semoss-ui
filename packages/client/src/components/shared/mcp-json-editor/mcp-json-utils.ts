import type {
	EditorTool,
	MCPJsonData,
	MCPTool,
	MCPToolInputSchema,
	MCPToolProperty,
} from "./types";

/** Sentinel type shown in the type dropdown for string enums. */
export const ENUM_TYPE_VALUE = "enum";

export const TYPE_OPTIONS = [
	{ value: "array", label: "Array" },
	{ value: "boolean", label: "Boolean" },
	{ value: ENUM_TYPE_VALUE, label: "Enum" },
	{ value: "number", label: "Number" },
	{ value: "object", label: "Object" },
	{ value: "string", label: "String" },
];

export const EXECUTION_OPTIONS = [
	{ value: "auto", label: "Auto" },
	{ value: "ask", label: "Ask first" },
	{ value: "yesno", label: "Yes/No" },
	{ value: "disabled", label: "Disabled" },
];

export const DISPLAY_LOCATION_OPTIONS = [
	{ value: "sidebar", label: "Sidebar" },
	{ value: "inline", label: "Inline" },
	{ value: "hidden", label: "Hidden" },
];

/** `_meta` keys the structured metadata editor owns. */
export const META_EXECUTION_KEY = "SMSS_MCP_EXECUTION";
export const META_FUNCTION_NAME_KEY = "SMSS_FUNCTION_NAME";
export const META_UI_KEY = "SMSS_MCP_UI";

let toolIdCounter = 0;

/** Monotonic editor-local id. Never written to the file. */
export const createToolId = (): string => {
	toolIdCounter += 1;
	return `mcp-tool-${toolIdCounter}`;
};

/**
 * Fills in the pieces of a tool the editor relies on without discarding any
 * keys the file already had.
 */
export const normalizeTool = (tool: MCPTool): MCPTool => {
	const schema = (tool?.inputSchema ?? {}) as Partial<MCPToolInputSchema>;

	return {
		...tool,
		name: typeof tool?.name === "string" ? tool.name : "",
		inputSchema: {
			...schema,
			type: "object",
			properties:
				schema.properties && typeof schema.properties === "object"
					? schema.properties
					: {},
			required: Array.isArray(schema.required) ? schema.required : [],
		},
	};
};

export const toEditorTools = (tools: MCPTool[]): EditorTool[] =>
	(Array.isArray(tools) ? tools : []).map((tool) => ({
		id: createToolId(),
		tool: normalizeTool(tool),
		isNew: false,
		isDeleted: false,
	}));

/** The tools that will actually be written to disk. */
export const toSavedTools = (editorTools: EditorTool[]): MCPTool[] =>
	editorTools.filter((entry) => !entry.isDeleted).map((entry) => entry.tool);

/** Stable string used to detect whether anything changed since the last save. */
export const snapshotOf = (
	fileMeta: Record<string, string>,
	tools: MCPTool[],
) => JSON.stringify({ _meta: fileMeta, tools });

export const formatEnumValue = (
	value: string | number | boolean | null,
): string => {
	if (value === null) return "null";
	if (typeof value === "string") return `"${value}"`;
	return String(value);
};

export const formatMetaKey = (key: string): string =>
	key
		.replace(/_(date|time|at|on)$/i, "")
		.replace(/_+/g, " ")
		.trim()
		.toLowerCase();

/**
 * JSON.parse error messages vary by engine. Try to extract line/col so the user
 * can find the bad character without counting bytes by hand.
 */
export const locateJsonError = (
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

/** Array and object defaults are edited as raw JSON rather than a single input. */
export const isJsonType = (type: string): boolean =>
	type === "array" || type === "object";

/** Sentinel select option meaning "omit `default` from the schema entirely". */
export const NO_DEFAULT_VALUE = "__no_default__";

/** Appends `_2`, `_3`, ... until the candidate no longer collides. */
export const uniqueName = (base: string, taken: Set<string>): string => {
	if (!taken.has(base)) return base;
	let suffix = 2;
	while (taken.has(`${base}_${suffix}`)) suffix += 1;
	return `${base}_${suffix}`;
};

/**
 * Tool names are handed to the model provider as function names, and both
 * Anthropic and OpenAI restrict those to letters, digits, underscores, and
 * hyphens. A space anywhere in the name is rejected before the tool ever runs,
 * so the editor never lets one through.
 */
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/**
 * Coerces free text into a valid identifier rather than rejecting it. Spaces
 * and punctuation collapse into single underscores, so "Get bank statement"
 * becomes "Get_bank_statement".
 */
export const slugifyIdentifier = (value: string): string => {
	const cleaned = value
		.trim()
		.replace(/[^A-Za-z0-9_-]+/g, "_")
		.replace(/_{2,}/g, "_")
		.replace(/^_+|_+$/g, "");

	if (!cleaned) return "";
	// A leading digit is legal for the provider but not for a Python function,
	// which is what most of these tools resolve to.
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

/** Turns `get_bank_statement` into `Get Bank Statement` for the display title. */
const humanizeIdentifier = (value: string): string =>
	value
		.replace(/[_-]+/g, " ")
		.trim()
		.replace(
			/(^|\s)([a-z])/g,
			(_match, lead: string, char: string) =>
				`${lead}${char.toUpperCase()}`,
		);

export const validateIdentifier = (
	value: string,
	taken: Set<string>,
	label: string,
): string | undefined => {
	const trimmed = value.trim();
	if (!trimmed) return `${label} is required`;
	if (!IDENTIFIER_PATTERN.test(trimmed)) {
		return `${label} must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens`;
	}
	if (taken.has(trimmed)) return `${label} "${trimmed}" is already in use`;
	return undefined;
};

/**
 * Anthropic caps a tool name at 128 characters, and the backend prepends
 * `a<engineId>_` (38 characters) without truncating for that provider. See
 * MCPUtility.appendEngineIdToToolsMethodName.
 */
const MAX_SAFE_TOOL_NAME_LENGTH = 90;

export type ToolNameIssue = {
	name: string;
	reason: string;
};

/**
 * Audits tool names across the whole file.
 *
 * The backend applies no character validation of its own, and the name is
 * handed to the model provider verbatim. An invalid name therefore fails the
 * entire chat request for the room rather than just its own tool, so it is
 * worth surfacing even for tools the form editor never touched - the raw JSON
 * surface, a git-committed file, or a remote MCP server can all introduce one.
 */
export const findToolNameIssues = (tools: MCPTool[]): ToolNameIssue[] => {
	const issues: ToolNameIssue[] = [];
	const seen = new Set<string>();

	for (const tool of tools ?? []) {
		const name = typeof tool?.name === "string" ? tool.name : "";

		if (!name.trim()) {
			issues.push({ name: "(unnamed)", reason: "has no name" });
			continue;
		}
		if (!IDENTIFIER_PATTERN.test(name)) {
			issues.push({
				name,
				reason: /\s/.test(name)
					? "contains whitespace"
					: "uses characters outside letters, numbers, underscores, and hyphens",
			});
		} else if (name.length > MAX_SAFE_TOOL_NAME_LENGTH) {
			issues.push({
				name,
				reason: `is ${name.length} characters; over ${MAX_SAFE_TOOL_NAME_LENGTH} risks exceeding the provider limit once the engine id is prefixed`,
			});
		}
		if (seen.has(name)) {
			issues.push({ name, reason: "is duplicated" });
		}
		seen.add(name);
	}

	return issues;
};

/**
 * Renames a property key while preserving the original ordering, so parameters
 * do not jump around the list when they are renamed.
 */
export const renameProperty = (
	properties: Record<string, MCPToolProperty>,
	oldKey: string,
	newKey: string,
): Record<string, MCPToolProperty> => {
	const next: Record<string, MCPToolProperty> = {};
	for (const [key, value] of Object.entries(properties)) {
		next[key === oldKey ? newKey : key] = value;
	}
	return next;
};

/**
 * A new parameter carries no `default` at all. Seeding one would write a
 * meaningless `""` or `0` into the schema and make the parameter look like it
 * has an intentional fallback when it does not.
 */
export const createEmptyProperty = (type: string): MCPToolProperty => ({
	title: "",
	description: "",
	type: type === ENUM_TYPE_VALUE ? "string" : type,
	...(type === ENUM_TYPE_VALUE ? { enum: [] } : {}),
});

export type NewToolInput = {
	name: string;
	title: string;
	description: string;
	functionName: string;
	toolType?: string;
};

export const createTool = ({
	name,
	title,
	description,
	functionName,
	toolType,
}: NewToolInput): MCPTool => {
	const meta: Record<string, unknown> = { [META_EXECUTION_KEY]: "auto" };
	if (functionName.trim()) {
		meta[META_FUNCTION_NAME_KEY] = functionName.trim();
	}

	return {
		name: name.trim(),
		// Falling back to the raw identifier would put `get_bank_statement` in
		// front of people in chat, so humanize it instead.
		title: title.trim() || humanizeIdentifier(name.trim()),
		description: description.trim(),
		inputSchema: {
			type: "object",
			title: `${name.trim()}_Arguments`,
			properties: {},
			required: [],
		},
		_meta: meta,
		...(toolType ? { _type: toolType } : {}),
	};
};

/** Deep clone through JSON so the copy shares no references with the original. */
export const cloneTool = (tool: MCPTool): MCPTool =>
	JSON.parse(JSON.stringify(tool)) as MCPTool;

/**
 * New tools should match whatever the rest of the file uses. py_mcp tools carry
 * `_type: "python"`; pixel tools carry no `_type` at all.
 */
export const deriveToolType = (
	tools: MCPTool[],
	path: string,
): string | undefined => {
	const existing = tools.find((tool) => typeof tool._type === "string");
	if (existing) return existing._type;
	if (path.toLowerCase().includes("py_mcp")) return "python";
	return undefined;
};

export const getExecutionMode = (tool: MCPTool): string => {
	const value = tool._meta?.[META_EXECUTION_KEY];
	return typeof value === "string" ? value : "ask";
};

export const getParamCount = (tool: MCPTool): number =>
	Object.keys(tool.inputSchema?.properties ?? {}).length;

export const getRequiredCount = (tool: MCPTool): number =>
	tool.inputSchema?.required?.length ?? 0;

/**
 * Search blob for a tool. Includes parameter names and descriptions so the
 * search box can answer "which tool takes an `account_id`?".
 */
export const toolSearchText = (tool: MCPTool): string => {
	const parts: string[] = [
		tool.name,
		tool.title ?? "",
		tool.description ?? "",
	];
	for (const [key, property] of Object.entries(
		tool.inputSchema?.properties ?? {},
	)) {
		parts.push(key, property?.title ?? "", property?.description ?? "");
	}
	return parts.join(" ").toLowerCase();
};

export type ParsedMCPFile = {
	data: MCPJsonData;
	/** Top-level keys the editor does not model, preserved for round tripping. */
	extras: Record<string, unknown>;
	error?: string;
};

/**
 * Reads a raw file body into editor data. Returns the parse error instead of
 * throwing so the caller can show the raw text rather than an empty editor
 * that would overwrite the file on the next save.
 */
export const parseMCPFile = (content: string): ParsedMCPFile => {
	const empty: MCPJsonData = { _meta: {}, tools: [] };

	if (!content || !content.trim()) {
		return { data: empty, extras: {} };
	}

	try {
		const parsed = JSON.parse(content) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return {
				data: empty,
				extras: {},
				error: "File must contain a JSON object",
			};
		}

		const record = parsed as Record<string, unknown>;
		const extras: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(record)) {
			if (key !== "_meta" && key !== "tools") extras[key] = value;
		}

		return {
			data: {
				_meta: (record._meta as Record<string, string>) ?? {},
				tools: Array.isArray(record.tools)
					? (record.tools as MCPTool[])
					: [],
			},
			extras,
		};
	} catch (e) {
		return {
			data: empty,
			extras: {},
			error: e instanceof Error ? e.message : "Invalid JSON",
		};
	}
};

/**
 * Normalizes whatever the pixel layer hands back (a JSON string, or an already
 * parsed object) into file text.
 */
export const toFileText = (output: unknown): string | null => {
	if (typeof output === "string") return output;
	if (output && typeof output === "object") {
		try {
			return JSON.stringify(output, null, 2);
		} catch {
			return null;
		}
	}
	return null;
};

export type LoadedMCPFile = {
	initialData: MCPJsonData;
	rawContent: string;
	/** Set when the file exists but is not valid JSON. */
	loadError?: string;
};

/**
 * Turns a raw pixel response into the props the editor needs. Keeps the raw
 * text and the parse error around so a malformed file opens in the JSON
 * surface instead of an empty form that a save would overwrite.
 */
export const readMCPFile = (output: unknown): LoadedMCPFile => {
	const text = toFileText(output) ?? "";
	const { data, error } = parseMCPFile(text);
	return { initialData: data, rawContent: text, loadError: error };
};

/** Friendly editor title derived from the file name. */
export const titleForPath = (path: string): string => {
	const fileName = path.split("/").pop()?.replace(".json", "") ?? "";
	const labelMap: Record<string, string> = {
		py_mcp: "Python",
		pixel_mcp: "Pixel",
	};
	const label = labelMap[fileName];
	return label
		? `${label} - MCP Tool Editor`
		: `${fileName.toUpperCase()} Tool Editor`;
};
