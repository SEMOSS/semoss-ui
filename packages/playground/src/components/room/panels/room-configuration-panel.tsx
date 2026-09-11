import { Settings2Icon } from "lucide-react";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { RoomConfiguration } from "../room-configuration";

/** The room's model and options form. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Configuration",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: () => <RoomConfiguration />,
};
