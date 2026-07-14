/**
 * Headless entry point — hooks and transport logic, no styled UI.
 * Presentational components live under the "@semoss/chat/components"
 * subpath, so a consumer can use this entry alone with its own UI.
 */
export type { ChatDefaultRoomSettings, ChatOptions } from "./chat-options";
export type { NormalizedRoomHistory } from "./history";
export { normalizeRoomHistory } from "./history";
export type { DateBucket } from "./lib/date";
export {
	DATE_BUCKET_ORDER,
	getDateBucket,
	normalizeTimestamp,
} from "./lib/date";
export type {
	App,
	ChatMessage,
	ChatMessagePart,
	ChatMessageStatus,
	ChatRole,
	ChatTextPart,
	ChatThinkingPart,
	ChatToolCallPart,
	ChatToolResultPart,
	Engine,
	MCP,
	MCPConfig,
	ProjectDependency,
	RoomSummary,
} from "./types";
export type { UseChatResult } from "./use-chat";
export { useChat } from "./use-chat";
export type { UseChatRoomsResult } from "./use-chat-rooms";
export { useChatRooms } from "./use-chat-rooms";
