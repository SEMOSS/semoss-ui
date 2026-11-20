import { useContext } from "react";
import {
	type WorkbenchRail,
	WorkbenchRailContext,
} from "./workbench-rail.context";

/**
 * Read the Workspace's rail an icon is in.
 *
 * @returns The rail's room, side, and the panels the chat offers.
 * @throws When called outside the rail.
 */
export const useWorkbench = (): WorkbenchRail => {
	const rail = useContext(WorkbenchRailContext);
	if (!rail) {
		throw new Error(
			"useWorkbench must be used inside the Workspace's rail",
		);
	}
	return rail;
};
