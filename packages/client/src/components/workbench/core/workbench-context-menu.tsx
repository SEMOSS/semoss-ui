import { type FC, type ReactNode, useState } from "react";
import { ContextMenu, ContextMenuTrigger } from "@semoss/ui/next";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { WorkbenchPanelMenuContent } from "./workbench-context-menu-content";

/**
 * One panel's right-click menu. Wraps the trigger surface (a tab or a border
 * header) — Radix owns the contextmenu event (and long-press on touch), so
 * there is no store-held menu state. The body only mounts once the menu has
 * been opened, keeping the store reads off the render path of every idle tab;
 * after that Radix itself portals the content only while open.
 */
export const WorkbenchPanelContextMenu: FC<{
	pid: WorkbenchPanelId;
	children: ReactNode;
}> = ({ pid, children }) => {
	const [everOpened, setEverOpened] = useState(false);
	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) {
					setEverOpened(true);
				}
			}}
		>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			{everOpened ? <WorkbenchPanelMenuContent pid={pid} /> : null}
		</ContextMenu>
	);
};
