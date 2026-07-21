import type { ToolCall } from "./types";

export interface ChatDefaultRoomSettings {
	instructions?: string;
	temperature?: number;
}

/** Result of `ChatOptions.localToolExecutor` for one tool call. */
export type LocalToolResult =
	| { handled: true; result: unknown }
	| { handled: false };

/**
 * The typed contract that replaces reading chat behavior off a raw
 * ThemeMap-style blob (see docs/chat-components/PLAN.md's taxonomy table).
 * Each consumer (playground, a vba-futures app, ...) maps its own config
 * system into this shape — useChat() never knows who's calling it.
 */
export interface ChatOptions {
	/** Which model/engine AskPlayground should target. */
	engineId: string;

	/**
	 * Resume an existing room's history instead of starting a new one. When
	 * set, ChatSession loads GetPlaygroundMessages on construction instead
	 * of lazily creating a room on first sendMessage(), and never overwrites
	 * the room's already-saved options with defaultRoomSettings.
	 */
	roomId?: string;

	/** Applied once per room via UpdateRoomOptions before the first ask. */
	defaultRoomSettings?: ChatDefaultRoomSettings;

	/**
	 * Caps how many auto tool-call rounds a single sendMessage() will run
	 * before giving up, so a misbehaving tool loop can't run forever.
	 * Defaults to 3.
	 */
	toolAutoExecutionLimit?: number;

	/**
	 * Maps a substring found in a thrown error's message to a user-facing
	 * message, so callers can avoid surfacing raw pixel/network errors.
	 */
	gracefulErrors?: Record<string, string>;

	/**
	 * Intercepts a tool call before the default RunMCPTool pixel call fires,
	 * so a host that has capabilities the SEMOSS server never will (e.g.
	 * the desktop app's Electron main process reading the user's local
	 * filesystem) can resolve specific tool calls itself instead of routing
	 * them to the server. Match on `toolCall._meta?.SMSS_PROJECT_ID` (or
	 * another stable identifier) to claim only the calls that are actually
	 * yours — return `{ handled: false }` for everything else so it falls
	 * through to the normal server-executed path. Omit this option entirely
	 * for hosts that have nothing to intercept (playground, client). A
	 * thrown error is handled identically to a failed RunMCPTool call
	 * (rendered as an error tool_result, then rethrown).
	 */
	localToolExecutor?: (toolCall: ToolCall) => Promise<LocalToolResult>;
}

export const DEFAULT_TOOL_AUTO_EXECUTION_LIMIT = 3;
