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
import { RoomActionsMenu } from "@/features/workbench/room-actions-menu";
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
 * through view changes. The More actions menu leads its left rail; the mobile
 * layout has no rails, so there it sits above the tabs instead. Its tab row is
 * its top edge; the room header opens and closes it.
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
		const actionsMenu = ({ vertical }: { vertical: boolean }) => (
			<RoomActionsMenu
				room={room}
				newRoomPanels={newRoomPanels}
				isVertical={vertical}
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
										? { top: { before: actionsMenu } }
										: { left: { before: actionsMenu } }
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
