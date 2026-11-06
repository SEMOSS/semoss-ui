import { type ComponentProps, createContext } from "react";
import type { RoomOptionsForm } from "./panels/room-options-form";

/** Keep new-chat settings bound to the draft after a file-capable room is prepared. */
export const DraftSettingsContext = createContext<ComponentProps<
	typeof RoomOptionsForm
> | null>(null);
