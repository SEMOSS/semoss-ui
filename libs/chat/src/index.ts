/**
 * Headless entry point — hooks and transport logic, no styled UI.
 * Presentational components live under the "@semoss/chat/components"
 * subpath, so a consumer can use this entry alone with its own UI.
 */

export {
	type ChatStoreRegistration,
	getActiveChatRoomId,
	registerChatStore,
	sendToActiveChat,
	sendToActiveRoom,
	setActiveChatRoom,
	setActiveChatStore,
} from "./chat-imperative";
export type { ChatDefaultRoomSettings, ChatOptions } from "./chat-options";
export { ChatProvider, useChatContext, useChatStore } from "./chat-provider";
export {
	ChatRoomsProvider,
	useChatRoomsContext,
	useChatRoomsStore,
} from "./chat-rooms-provider";
export {
	type ChatRoomsStoreState,
	createChatRoomsStore,
} from "./chat-rooms-store";
export { type ChatStoreState, createChatStore } from "./chat-store";
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
