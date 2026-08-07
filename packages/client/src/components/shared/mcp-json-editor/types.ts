/**
 * Shape of a single parameter inside a tool's `inputSchema.properties`.
 *
 * The index signature is deliberate: real MCP files carry JSON Schema keywords
 * the editor does not surface (`additionalProperties`, `items`, `format`, ...)
 * and those must survive a load/edit/save round trip untouched.
 */
export type MCPToolProperty = {
	title?: string;
	description?: string;
	type: string;
	default?: unknown;
	enum?: Array<string | number | boolean | null>;
	[key: string]: unknown;
};

/** A tool's argument schema. Always an object schema in practice. */
export type MCPToolInputSchema = {
	type: "object";
	title?: string;
	properties: Record<string, MCPToolProperty>;
	required: string[];
	[key: string]: unknown;
};

/** A single MCP tool definition as it is stored in the JSON file. */
export type MCPTool = {
	name: string;
	title?: string;
	description?: string;
	inputSchema: MCPToolInputSchema;
	/** Backing implementation kind, e.g. "python". Absent for pixel tools. */
	_type?: string;
	_meta?: Record<string, unknown>;
	[key: string]: unknown;
};

/** Top-level contents of a `py_mcp.json` / `pixel_mcp.json` file. */
export type MCPJsonData = {
	_meta: Record<string, string>;
	tools: MCPTool[];
};

/**
 * A tool plus editor-only identity. Tools are tracked by `id` rather than by
 * `name` so a rename, a duplicate, or a half-typed name on a brand new tool
 * can never make two rows collide or send an edit to the wrong tool.
 */
export type EditorTool = {
	id: string;
	tool: MCPTool;
	/** Added in this session and not yet saved. */
	isNew: boolean;
	/** Marked for removal; dropped from the file on save. */
	isDeleted: boolean;
};

/** Which surface of the editor is currently active. */
export type MCPEditorMode = "form" | "json";
