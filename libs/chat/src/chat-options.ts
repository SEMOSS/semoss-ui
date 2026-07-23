export interface ChatDefaultRoomSettings {
	instructions?: string;
	temperature?: number;
}

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

	/** Associate a newly-created room with this workspace. */
	workspaceId?: string;

	/** Applied once per room via UpdateRoomOptions before the first ask. */
	defaultRoomSettings?: ChatDefaultRoomSettings;

	/** Allowed tool list */
	allowedTools?: string[];

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
}

export const DEFAULT_TOOL_AUTO_EXECUTION_LIMIT = 3;
