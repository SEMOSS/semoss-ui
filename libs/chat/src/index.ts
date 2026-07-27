/**
 * Headless entry point — hooks and transport logic, no styled UI.
 * Presentational components live under the "@semoss/chat/components"
 * subpath, so a consumer can use this entry alone with its own UI.
 */

export {
	type ChatStoreRegistration,
	getActiveChatRoomId,
	getActiveChatStore,
	getChatStoreByRoomId,
	registerChatStore,
	sendToActiveChat,
	sendToActiveRoom,
	setActiveChatRoom,
	setActiveChatStore,
} from "./chat-imperative";
export type { ChatDefaultRoomSettings, ChatOptions } from "./chat-options";
export {
	ChatProvider,
	ChatRoomsProvider,
	useChatContext,
	useChatRoomsContext,
	useChatRoomsStore,
	useChatStore,
	useRoomMessages,
} from "./contexts";
export type { NormalizedRoomHistory } from "./history";
export { normalizeRoomHistory } from "./history";
export type { DateBucket } from "./lib/date";
export {
	DATE_BUCKET_ORDER,
	getDateBucket,
	normalizeTimestamp,
} from "./lib/date";
export {
	type ChatRoomsStoreState,
	type ChatStoreState,
	createChatRoomsStore,
	createChatStore,
} from "./stores";
/**
 * `runAgent` is exported directly (unlike the rest of `transport/`, which
 * `ChatSession`/`createChatStore` keep internal) because `ChatSession`
 * doesn't drive the backend's agent harness yet — see
 * docs/chat-components/PLAN.md's deferred items. Exporting it here is what
 * makes it reachable at all today, since `package.json`'s `exports` map
 * only surfaces `.`/`./components`, not `transport/pixel-calls` directly.
 * Once `ChatSession` grows a `harnessType` option that calls this
 * internally, this export can stay (a still-useful escape hatch for
 * consumers who want the raw stream) or fold away — not decided yet.
 */
export { runAgent } from "./transport/pixel-calls";
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
	RunAgentResult,
} from "./types";
