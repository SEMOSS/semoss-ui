import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { normalizeFolderPath } from "@semoss/sdk";
import { useRoomSelector } from "@semoss/sdk/react";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { RoomProvider } from "../../contexts/room.context";
import { useChat } from "../../host/chat.context";
import type { ChatFileExplorerHost } from "../../host/chat-host-config";
import { useNextMessageRoom } from "../conversation/next-message-room.context";
import type { RoomUiStore } from "./room-ui.store";

/** Props for {@link RoomWorkbench}. */
export interface RoomWorkbenchProps {
	/** The room owns the dock, including while this view is hidden. */
	room: RoomUiStore;
}

/**
 * A room's Workspace: its `@semoss/workbench` dock, whose editors stay mounted
 * through view changes. It passes the workbench no border slots, so its tab
 * row is its top edge; the room header opens and closes it.
 */
export const RoomWorkbench = ({ room }: RoomWorkbenchProps) => {
	const { t } = useTranslation("connectors");
	const { config } = useChat();
	const ExplorerHostProvider = config.filePanels?.ExplorerHostProvider;
	const nextMessageRoom = useNextMessageRoom() ?? room;
	const sidebarSnapshot = useRoomSelector(room, (r) => r.sidebarSnapshot);
	const explorerHost = useMemo<ChatFileExplorerHost>(
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
					{/* the host's file explorer offers Add to context */}
					{ExplorerHostProvider ? (
						<ExplorerHostProvider host={explorerHost}>
							<Workbench snapshot={sidebarSnapshot} />
						</ExplorerHostProvider>
					) : (
						<Workbench snapshot={sidebarSnapshot} />
					)}
				</WorkbenchProvider>
			</RoomProvider>
		</div>
	);
};
