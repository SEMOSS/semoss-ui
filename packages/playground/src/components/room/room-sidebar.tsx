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
import type { RoomStore } from "@/stores/room/room.store";

interface RoomSidebarProps {
	/** The room owns the dock, including while this view is hidden. */
	room: RoomStore;
}

/**
 * A contextual work area whose editors stay mounted through view changes. It
 * passes the workbench no border slots, so its tab row is its top edge: the
 * room header closes it, and the header's Other menu publishes the room.
 */
export const RoomSidebar = observer(({ room }: RoomSidebarProps) => {
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
										path: normalizeFolderPath(item.path),
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
						<Workbench snapshot={room.sidebarSnapshot} />
					</FileExplorerHostProvider>
				</WorkbenchProvider>
			</RoomProvider>
		</div>
	);
});
