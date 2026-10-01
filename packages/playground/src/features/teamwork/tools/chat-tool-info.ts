import { isAskExecutionMode } from "@/utility/mcp-utils";

/** One argument a tool takes, as its input schema describes it. */
export interface ChatToolParameter {
	name: string;
	/** What the schema says the argument is for, or `""`. */
	description: string;
	/** Whether the model has to pass it. */
	isRequired: boolean;
}

/** A tool the assistant can use, as the Chat Tools panel shows it. */
export interface ChatToolInfo {
	/** What the model calls. */
	name: string;
	/** The tool's title, or its name when it has none. */
	title: string;
	/** What the model is told the tool does. */
	description: string;
	/** Whether a call runs on its own or waits for the user. */
	execution: "auto" | "ask";
	parameters: ChatToolParameter[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The arguments an input schema lists, required ones first.
 *
 * @param inputSchema - A tool's JSON schema.
 * @return The arguments, or none when the schema lists no properties.
 */
export const listToolParameters = (
	inputSchema: unknown,
): ChatToolParameter[] => {
	if (!isRecord(inputSchema) || !isRecord(inputSchema.properties)) {
		return [];
	}
	const required = new Set(
		Array.isArray(inputSchema.required)
			? inputSchema.required.filter(
					(name): name is string => typeof name === "string",
				)
			: [],
	);
	return Object.entries(inputSchema.properties)
		.map(([name, property]) => ({
			name: name,
			description:
				isRecord(property) && typeof property.description === "string"
					? property.description
					: "",
			isRequired: required.has(name),
		}))
		.sort(
			(first, second) =>
				Number(second.isRequired) - Number(first.isRequired),
		);
};

/**
 * The tools a room's toolbox offers the assistant, from the tool file
 * `MakeRoomPixelMCP` keeps in the room's folder. Tools written as `disabled`,
 * which the file holds only because the reactor needs at least one, are left
 * out: the assistant is never offered them.
 *
 * @param mcpJson - The parsed `mcp/pixel_mcp.json`.
 * @return The tools, each with the reactor it runs.
 */
export const parseRoomToolbox = (
	mcpJson: unknown,
): (ChatToolInfo & { reactor: string })[] => {
	const tools =
		isRecord(mcpJson) && Array.isArray(mcpJson.tools) ? mcpJson.tools : [];
	return tools.reduce<(ChatToolInfo & { reactor: string })[]>(
		(offered, tool) => {
			if (!isRecord(tool) || typeof tool.name !== "string") {
				return offered;
			}
			const meta = isRecord(tool._meta) ? tool._meta : {};
			const execution =
				typeof meta.SMSS_MCP_EXECUTION === "string"
					? meta.SMSS_MCP_EXECUTION
					: undefined;
			if (execution === "disabled") {
				return offered;
			}
			offered.push({
				name: tool.name,
				reactor:
					typeof meta.SMSS_FUNCTION_NAME === "string"
						? meta.SMSS_FUNCTION_NAME
						: tool.name,
				title:
					typeof tool.title === "string" && tool.title
						? tool.title
						: tool.name,
				description:
					typeof tool.description === "string"
						? tool.description
						: "",
				execution: isAskExecutionMode(execution) ? "ask" : "auto",
				parameters: listToolParameters(tool.inputSchema),
			});
			return offered;
		},
		[],
	);
};
