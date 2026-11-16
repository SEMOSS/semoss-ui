import { useCallback, useRef, useState } from "react";
import { parseMcpTools, type ToolboxTool } from "./tools/chat-tool-info";

/** What {@link useToolsRead} returns. */
export interface ToolsRead {
	/** `idle` until the first {@link ToolsRead.load} for the current source. */
	status: "idle" | "loading" | "ready" | "error";
	/** The tools last read from the current source. */
	tools: ToolboxTool[];
	/** Read the tools, again if they were read before. */
	load: () => void;
}

interface ToolsReadState {
	source: string;
	status: ToolsRead["status"];
	tools: ToolboxTool[];
}

/**
 * Tools read from an MCP document on request, for the toolbox hooks.
 *
 * The state belongs to one source: when `source` changes, the tools read for
 * the last one are dropped and the status goes back to `idle`. A read that
 * finishes after a newer one started, or after the source changed, is
 * ignored.
 *
 * @param source - Identifies what `read` reads, such as a toolbox's id.
 * @param read - Reads the MCP document; keep it stable for one source.
 * @return The tools, how the read went, and a way to read them.
 */
export const useToolsRead = (
	source: string,
	read: () => Promise<unknown>,
): ToolsRead => {
	const [state, setState] = useState<ToolsReadState>({
		source: source,
		status: "idle",
		tools: [],
	});
	const latestRequest = useRef(0);

	const load = useCallback(() => {
		latestRequest.current += 1;
		const request = latestRequest.current;
		const settle = (
			status: "ready" | "error",
			tools?: ToolboxTool[],
		): void => {
			if (request !== latestRequest.current) return;
			setState((previous) => ({
				source: source,
				status: status,
				tools: tools ?? previous.tools,
			}));
		};

		setState((previous) => ({
			source: source,
			status: "loading",
			tools: previous.source === source ? previous.tools : [],
		}));
		read()
			.then(parseMcpTools)
			.then(
				(tools) => settle("ready", tools),
				() => settle("error"),
			);
	}, [source, read]);

	if (state.source !== source) {
		return { status: "idle", tools: [], load: load };
	}
	return { status: state.status, tools: state.tools, load: load };
};
