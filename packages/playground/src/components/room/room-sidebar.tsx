import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
} from "@semoss/panels";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { RoomProvider } from "@/contexts/room.context";
import { normalizeFolderPath } from "@/features/chat-tools/folders/folder-path";
import { useNextMessageRoom } from "@/features/conversation/next-message-room.context";
import { RoomWorkbenchMenus } from "@/features/workbench/room-workbench-menus";
import type { DraftWorkspacePlaces } from "@/features/workbench/use-workspace-places";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomSidebarActions } from "./room-sidebar-actions";

interface RoomSidebarProps {
	/** The room owns the dock, including while this view is hidden. */
	room: RoomStore;
	/** A new chat's own actions, including lazy preparation for Files. */
	draft?: DraftWorkspacePlaces;
	/** Publishing becomes available once the draft has prepared a room. */
	canPublish?: boolean;
}

/** A contextual work area whose editors stay mounted through view changes. */
export const RoomSidebar = observer(
	({ room, draft, canPublish = true }: RoomSidebarProps) => {
		const { t } = useTranslation("connectors");
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
		return (
			// The workbench's absolute shell must stay inside this pane.
			<div className="relative h-full min-h-0 w-full bg-background">
				<RoomProvider room={room}>
					<WorkbenchProvider store={room.workbench}>
						<FileExplorerHostProvider host={explorerHost}>
							<Workbench
								snapshot={room.sidebarSnapshot}
								borderSlots={{
									top: {
										before: ({ onNavigate }) => (
											<RoomWorkbenchMenus
												onNavigate={onNavigate}
												draft={draft}
											/>
										),
										after: (
											<RoomSidebarActions
												room={room}
												canPublish={canPublish}
											/>
										),
									},
								}}
							/>
						</FileExplorerHostProvider>
					</WorkbenchProvider>
				</RoomProvider>
			</div>
		);
	},
);
