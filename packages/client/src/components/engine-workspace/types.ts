type MCPToolProperty = {
	title: string;
	description?: string;
	type: string;
	default?: unknown;
};

type MCPTool = {
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
};

export type MCPJsonData = {
	_meta: Record<string, string>;
	tools: MCPTool[];
};
export const isMCPJsonData = (v: unknown): v is MCPJsonData => {
	if (!v || typeof v !== "object") return false;
	const obj = v as Record<string, unknown>;
	if (!("_meta" in obj) || !("tools" in obj)) return false;
	if (typeof obj._meta !== "object" || !Array.isArray(obj.tools))
		return false;

	for (const tool of obj.tools) {
		if (!tool || typeof tool !== "object") return false;
		if (!("name" in tool) || typeof tool.name !== "string") return false;
		if (!("title" in tool) || typeof tool.title !== "string") return false;
		if (!("_type" in tool) || typeof tool._type !== "string") return false;
		if (!("inputSchema" in tool) || typeof tool.inputSchema !== "object")
			return false;

		const schema = tool.inputSchema as Record<string, unknown>;
		if (!("properties" in schema) || typeof schema.properties !== "object")
			return false;
		if (!("required" in schema) || !Array.isArray(schema.required))
			return false;
		if (!("title" in schema) || typeof schema.title !== "string")
			return false;
		if (!("type" in schema) || schema.type !== "object") return false;
	}

	return true;
};
