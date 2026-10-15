import { createContext } from "react";
import type { RoomSettingsFormProps } from "./room-settings-form";

/** Live room values and write callback never enter serialized dock configuration. */
export type RoomSettingsPanelContextValue = Omit<
	RoomSettingsFormProps,
	"presentation" | "onCancel" | "onSaved" | "onSubmittingChange"
>;

export const RoomSettingsPanelContext =
	createContext<RoomSettingsPanelContextValue | null>(null);
