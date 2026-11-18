import { createContext } from "react";
import type { RoomStore } from "../../room/store/room.store";
import type { WorkbenchPanelOption } from "./use-workbench-panels";

/** What the Workspace's rail gives its icons, the chat's own and a host's. */
export interface WorkbenchRail {
	/** The room whose Workspace the rail opens panels in. */
	readonly room: RoomStore;
	/** Whether the room is a new chat's, whose panels prepare its room first. */
	readonly isNewChat: boolean;
	/** Which way a label opens: into the dock, or below the mobile toolbar. */
	readonly side: "right" | "bottom";
	/** The panels the chat offers: Files, Settings, the activity log, the connector viewers. */
	readonly panels: readonly WorkbenchPanelOption[];
}

/** The rail, for its icons. Null outside the rail. */
export const WorkbenchRailContext = createContext<WorkbenchRail | null>(null);
