import { runPixel } from "./base";

/** One tool {@link makeUserPixelMcp} writes: the reactor it runs and its MCP metadata. */
export interface UserPixelMcpTool {
	/** The reactor the tool runs, such as `MicrosoftOutlookListMail`. */
	reactor: string;
	/** The tool's `_meta`, such as how it runs and where its card shows. */
	metadata: Record<string, unknown>;
}

/**
 * Write a generator's tools into a pixel MCP file in the signed in user's own
 * assets (MakeUserPixelMCP), each stamped with the generator. With no tools it
 * names no reactors, which empties the generator's tools out of the file.
 *
 * @param params.filePath - The file's path in the user's assets.
 * @param params.generator - Stamped on every tool written, as
 * `SMSS_MCP_GENERATOR`.
 * @param params.tools - The tools to write.
 * @returns The file as the backend wrote it.
 * @throws Error when the backend refuses the write.
 */
export const makeUserPixelMcp = async (params: {
	filePath: string;
	generator: string;
	tools: readonly UserPixelMcpTool[];
}): Promise<unknown> => {
	const { filePath, generator, tools } = params;
	const toolClauses =
		tools.length > 0
			? `, reactor=${JSON.stringify(tools.map((tool) => tool.reactor))}, mcpMetadata=${JSON.stringify(tools.map((tool) => tool.metadata))}`
			: "";

	const response = await runPixel<[unknown]>(
		`MakeUserPixelMCP(filePath=${JSON.stringify([filePath])}${toolClauses}, generator=${JSON.stringify([generator])});`,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0]?.output;
};

/**
 * Run one tool of an MCP server (RunMCPTool), such as a tool in a room's own
 * toolbox. For a paused agent run's tool, use {@link decideAgentRunAction}.
 *
 * @param params.project - The MCP server that holds the tool.
 * @param params.roomId - The room the tool runs for.
 * @param params.name - The tool's name.
 * @param params.paramValues - The tool's arguments.
 * @param insightId - Insight to run the pixel against.
 * @returns The tool's output as text; output that is not text comes back as
 * JSON, and no output as an empty string.
 * @throws Error when the tool fails or answers with nothing.
 */
export const runMcpTool = async (
	params: {
		project: string;
		roomId: string;
		name: string;
		paramValues: Record<string, unknown>;
	},
	insightId?: string,
): Promise<string> => {
	const { project, roomId, name, paramValues } = params;

	const response = await runPixel<[unknown]>(
		`RunMCPTool(project=${JSON.stringify([project])}, roomId=${JSON.stringify(roomId)}, function=${JSON.stringify([name])}, paramValues=[${JSON.stringify(paramValues)}]);`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const [result] = response.pixelReturn;
	if (!result) {
		throw new Error(`${name} returned no result.`);
	}
	if (typeof result.output === "string") {
		return result.output;
	}
	// a tool that returns nothing stringifies to undefined
	return JSON.stringify(result.output) ?? "";
};
