import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
} from "@semoss/panels";
import { useIsMobile } from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { RoomProvider } from "@/contexts/room.context";
import { normalizeFolderPath } from "@/features/chat-tools/folders/folder-path";
import { useNextMessageRoom } from "@/features/conversation/next-message-room.context";
import { RoomWorkbenchRail } from "@/features/workbench/room-workbench-rail";
import type { NewRoomWorkbenchPanels } from "@/features/workbench/use-workbench-panels";
import type { RoomStore } from "@/stores/room/room.store";

interface RoomWorkbenchProps {
	/** The room owns the dock, including while this view is hidden. */
	room: RoomStore;
	/** A new chat's own panel actions, which prepare its room, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
}

/**
 * A room's Workspace: its `@semoss/workbench` dock, whose editors stay mounted
 * through view changes. Files and Settings open as tabs in its main area, and
 * its rail — the room's cog menu over one icon per panel — stands on its left
 * edge. The mobile layout has no rails, so there the same rail runs across the
 * top, above the tabs. Its tab row is its top edge; the room header opens and
 * closes it.
 */
export const RoomWorkbench = observer(
	({ room, newRoomPanels }: RoomWorkbenchProps) => {
		const { t } = useTranslation("connectors");
		const isMobile = useIsMobile();
		const nextMessageRoom = useNextMessageRoom() ?? room;
		const explorerHost = useMemo<FileExplorerHost>(
			() => ({
				secondaryActions: (item) =>
					item.type === "directory"
						? []
						: [
								{
									name: t("actions.addToContext"),
									placement: "end",
									action: async () => {
										nextMessageRoom.contextItems.add({
											path: normalizeFolderPath(
												item.path,
											),
											name: item.name,
										});
									},
								},
							],
			}),
			[nextMessageRoom, t],
		);
		// a left rail opens its labels and menu into the dock; the mobile
		// toolbar sits above the tabs, so there they open downward
		const panelRail = ({ vertical }: { vertical: boolean }) => (
			<RoomWorkbenchRail
				room={room}
				newRoomPanels={newRoomPanels}
				side={vertical ? "right" : "bottom"}
			/>
		);
		return (
			// The workbench's absolute shell must stay inside this pane.
			<div className="relative h-full min-h-0 w-full bg-background">
				<RoomProvider room={room}>
					<WorkbenchProvider store={room.workbench}>
						<FileExplorerHostProvider host={explorerHost}>
							<Workbench
								snapshot={room.sidebarSnapshot}
								borderSlots={
									isMobile
										? { top: { before: panelRail } }
										: { left: { before: panelRail } }
								}
								mobileTopBorder="toolbar"
							/>
						</FileExplorerHostProvider>
					</WorkbenchProvider>
				</RoomProvider>
			</div>
		);
	},
);
