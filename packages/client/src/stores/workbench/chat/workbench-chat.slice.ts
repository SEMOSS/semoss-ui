import type { MCPConfig } from "@semoss/shared";
import type { WorkbenchChatToolHandler } from "@/components/workbench/chat";
import type { WorkbenchSlice } from "../workbench.types";

/** Namespaced domain state contributed by the base chat slice. */
export interface WorkbenchChatSliceState {
	chat: {
		/** System prompt sent to the assistant for this workbench's CHAT panel. */
		systemPrompt: string;

		/** MCP servers exposed to the assistant for this workbench's CHAT panel. */
		mcp: MCPConfig[];

		/** Workbench-local handlers for custom tools surfaced to the assistant. */
		toolHandlers: Record<string, WorkbenchChatToolHandler>;

		/** Updates one or more chat config fields for this workbench instance. */
		configure: (config: {
			systemPrompt?: string;
			mcp?: MCPConfig[];
			toolHandlers?: Record<string, WorkbenchChatToolHandler>;
		}) => void;
	};
}

/**
 * Creates the base `chat` slice merged into every workbench store, holding the
 * assistant system prompt, MCP servers, and custom tool handlers for the
 * workbench's CHAT border panel.
 *
 * @name createWorkbenchChatSlice
 * @return Zustand state creator contributing the `chat` key to the workbench store.
 */
export const createWorkbenchChatSlice =
	(): WorkbenchSlice<WorkbenchChatSliceState> => (set) => ({
		chat: {
			systemPrompt: "",
			mcp: [],
			toolHandlers: {},
			configure: (config) => {
				set((state) => ({
					chat: {
						...state.chat,
						...config,
					},
				}));
			},
		},
	});
