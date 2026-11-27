import { createContext, useContext } from "react";
import type { RoomStore } from "../../room/store/room.store";
import type { WorkbenchPanelOption } from "./use-workbench-panels";

/** What the Workspace's rail gives its icons, the chat's own and a host's. */
export interface WorkbenchRailValue {
	/** The room whose Workspace the rail opens panels in. */
	readonly room: RoomStore;
	/** Whether the room is a new chat's, whose panels prepare its room first. */
	readonly isDraft: boolean;
	/** Which way a label opens: into the dock, or below the mobile toolbar. */
	readonly side: "right" | "bottom";
	/** The panels the chat offers: Files, Settings, the activity log, the connector viewers. */
	readonly panels: readonly WorkbenchPanelOption[];
}

/** The rail, for its icons. Null outside the rail. */
export const WorkbenchRailContext = createContext<WorkbenchRailValue | null>(
	null,
);

/**
 * Read the Workspace's rail an icon is in.
 *
 * @returns The rail's room, side, and the panels the chat offers.
 * @throws When called outside the rail.
 */
export const useWorkbenchRail = (): WorkbenchRailValue => {
	const rail = useContext(WorkbenchRailContext);
	if (!rail) {
		throw new Error(
			"useWorkbenchRail must be used inside the Workspace's rail",
		);
	}
	return rail;
};
