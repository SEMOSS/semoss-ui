import type { PendingAgentAction } from "../../types";
import type { ClientToolProvider } from "./chat-tools/client-tool-provider";
import type { RoomEngine } from "./room-engine.store";

/**
 * An answer to an agent run's pending action, given by the host instead of
 * the user — how a client supplies data to an agent-run tool with no backend
 * change (the action is answered through the approval channel).
 */
export interface AutoDecision {
	/** `submit` approves (with `paramValues` as edits), or answers with them. */
	decision: "submit" | "reject" | "respond";
	/** The arguments to run with, or the answers to respond with. */
	paramValues?: Record<string, unknown>;
}

/**
 * Everything a host configures about the rooms it runs, without React.
 * Rooms always go through the playground reactors. Pass it to `RoomsClient`
 * (every room it makes shares it) or to a `RoomEngine` directly.
 */
export interface RoomEngineConfig {
	/** Names exported files (`<appName> Room Export`). */
	appName?: string;
	/**
	 * A marker stamped into every room the host creates and passed as
	 * `roomOptionsSearch` when it lists rooms — how an embedded surface keeps
	 * its history apart. The backend matches with a prefix-sensitive LIKE, so
	 * scope tokens must not prefix one another.
	 */
	roomScope?: { token: string };
	/** Instructions a new room starts with. */
	instructions?: string;
	/**
	 * Read before every turn and appended to the instructions the turn runs
	 * with, such as the page the user is on or the OS they run. Return null
	 * for nothing to add.
	 */
	turnContext?: () => string | null | Promise<string | null>;
	/** Caps for agent runs. */
	runParams?: { maxTurns?: number; maxReflections?: number };
	/** Tools the client runs; see {@link ClientToolProvider}. */
	clientTools?: readonly ClientToolProvider[];
	/** How many tool calls run at once in a chat turn; five when unset. */
	toolAutoExecutionLimit?: number | null;
	/** Send the room's `temperature` option with chat turns. */
	sendTemperature?: boolean;
	/**
	 * The file extensions sent to the model with a message; others stay in
	 * the room's files for its tools. Every file when empty.
	 */
	allowedFileTypes?: readonly string[];
	/** The model a room uses when nothing else picks one. */
	defaultRoomSettings?: { model?: string };
	/** Name a room from its first exchange with `GenerateRoomName`. */
	autoNameRooms?: boolean;
	/**
	 * Called for every new pending action of an agent run. Resolve to an
	 * {@link AutoDecision} to answer it, or null to leave it to the user.
	 */
	onPendingAction?: (
		action: PendingAgentAction,
		room: RoomEngine,
	) => Promise<AutoDecision | null>;
}
