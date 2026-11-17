import { type ComponentProps, createContext } from "react";
import type { RoomOptionsForm } from "../room/settings/room-options-form";

/**
 * A new chat's draft Settings, as props for `RoomOptionsForm`, or null in a
 * room. `NewChat` provides it so the Settings panel stays bound to the draft
 * after a file-capable room is prepared, until the first message.
 */
export const DraftSettingsContext = createContext<ComponentProps<
	typeof RoomOptionsForm
> | null>(null);
