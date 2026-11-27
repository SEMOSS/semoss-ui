import { useCallback, useRef, useState } from "react";
import {
	parseMcpTools,
	type ToolboxTool,
} from "../../tools/chat-tools/chat-tool-info";

/** What {@link useToolsRead} returns. */
export interface ToolsRead {
	/** `idle` until the first {@link ToolsRead.load} for the current source. */
	status: "idle" | "loading" | "ready" | "error";
	/** The tools last read from the current source. */
	tools: ToolboxTool[];
	/** Read the tools, again if they were read before. */
	load: () => void;
}

/** What {@link useToolsRead} keeps between renders. */
interface ToolsReadState {
	/** The source the status and tools were read for. */
	source: string;
	/** How the last read for `source` went. */
	status: ToolsRead["status"];
	/** The tools last read for `source`. */
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
 * @returns The tools, how the read went, and a way to read them.
 */
export const useToolsRead = (
	source: string,
	read: () => Promise<unknown>,
): ToolsRead => {
	const [state, setState] = useState<ToolsReadState>({
		source,
		status: "idle",
		tools: [],
	});
	// counts reads, so a read that a newer one overtook can tell it is stale
	const latestRequest = useRef(0);

	const load = useCallback(() => {
		latestRequest.current += 1;
		const request = latestRequest.current;
		/**
		 * Record how this read ended, unless a newer read has started.
		 *
		 * @param status - How the read ended.
		 * @param tools - The tools read; left out to keep the last ones.
		 */
		const settle = (
			status: "ready" | "error",
			tools?: ToolboxTool[],
		): void => {
			if (request !== latestRequest.current) return;
			setState((previous) => ({
				source,
				status,
				tools: tools ?? previous.tools,
			}));
		};

		setState((previous) => ({
			source,
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

	// the source changed since the last read: nothing has been read for it yet
	if (state.source !== source) {
		return { status: "idle", tools: [], load: load };
	}
	return { status: state.status, tools: state.tools, load: load };
};
