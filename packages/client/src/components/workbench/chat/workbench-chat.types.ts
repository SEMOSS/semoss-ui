import type { MCPConfig } from "@semoss/shared";
import type { WorkbenchChatToolCall } from "@/api/rooms";

export type {
	WorkbenchChatModelOptions,
	WorkbenchChatToolCall,
	WorkbenchChatToolMeta,
} from "@/api/rooms";

/** Context supplied to a workbench-local tool handler. */
export interface WorkbenchChatToolHandlerContext {
	insightId: string;
	roomId: string;
	responseMessageId: string;
	toolCall: WorkbenchChatToolCall;
}

/** Executes a configured MCP tool inside the owning workbench. */
export type WorkbenchChatToolHandler = (
	parameters: Record<string, unknown>,
	context: WorkbenchChatToolHandlerContext,
) => unknown | Promise<unknown>;

/** Generic chat configuration supplied by a workbench or future workspace. */
export interface WorkbenchChatConfig {
	systemPrompt: string;
	mcp: MCPConfig[];
	toolHandlers?: Record<string, WorkbenchChatToolHandler>;
}
