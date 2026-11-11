import { ListChecks } from "lucide-react";
import { createElement, useContext } from "react";
import { P } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { TaskContextView } from "@/features/collaboration/components/task-context";
import { ROOM_TASK_PANEL_TYPE } from "@/features/room-connectors/room-connectors.constants";
import { RoomEmailContext } from "@/features/room-email/room-email.context";
import { RoomTaskContext } from "./room-task-panel.context";

/** Steps and related threads for the work item behind this room. */
function RoomTaskPanel() {
	const ctx = useContext(RoomTaskContext);
	const email = useContext(RoomEmailContext);
	if (!ctx?.task)
		return (
			<P className="p-4 text-muted-foreground text-sm">
				{ctx?.loading ? "Loading..." : "This room has no work item."}
			</P>
		);
	return (
		<section aria-label="Task" className="size-full overflow-y-auto">
			<TaskContextView
				task={ctx.task}
				onOpenThread={
					email
						? (t) =>
								email.openItem({
									kind: "thread",
									threadId: t.id,
									source:
										t.source === "teams"
											? "teams"
											: "email",
									title: t.subject,
								})
						: undefined
				}
			/>
		</section>
	);
}

const ROOM_TASK_PANEL: WorkbenchPanelConfig = {
	name: "Task",
	icon: ({ className }) =>
		createElement(ListChecks, { className, "aria-hidden": true }),
	content: RoomTaskPanel,
	mount: "keepAlive",
	canClose: false,
	canDrag: false,
	canRename: false,
	canSplitTab: false,
	matches: () => true,
};

export const ROOM_TASK_PANEL_COMPONENTS = {
	[ROOM_TASK_PANEL_TYPE]: ROOM_TASK_PANEL,
};
