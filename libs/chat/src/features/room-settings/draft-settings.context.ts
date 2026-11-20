import { createContext } from "react";
import type { ComposerSession } from "../conversation/composer/use-composer-session";

/** A new chat's draft Settings: the draft's session, and whether edits are locked. */
export interface DraftSettings {
	/** The draft's model, options and agent, and how they change. */
	readonly session: ComposerSession;
	/** Locks every edit while the room is prepared, created, or its agent read. */
	readonly disabled: boolean;
}

/**
 * A new chat's draft Settings, or null in a room. `NewChat` provides it so the
 * Settings panel stays bound to the draft after a file-capable room is
 * prepared, until the first message.
 */
export const DraftSettingsContext = createContext<DraftSettings | null>(null);
