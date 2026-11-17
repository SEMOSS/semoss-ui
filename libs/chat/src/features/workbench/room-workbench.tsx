import { ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
	FileSourcesProvider,
} from "@semoss/panels";
import type { FileExplorerSecondaryAction } from "@semoss/shared";
import { toast, useIsMobile } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { useNextMessageRoom } from "../conversation/attachments/next-message-room.context";
import { useRoomFileSources } from "../local-folders/explorer/use-room-file-sources";
import { RoomProvider, useRoomOrContext } from "../room/scope/room.context";
import type { RoomStore } from "../room/store/room.store";
import { uploadTurnFiles } from "../room/store/room-turn-files";
import { useRoomSelector } from "../room/store/use-room-selector";
import { normalizeFolderPath } from "../tools/folders/folder-path";
import { RoomWorkbenchRail } from "./rail/room-workbench-rail";
import type { NewRoomWorkbenchPanels } from "./rail/use-workbench-panels";

/** Props for {@link RoomWorkbench}. */
interface RoomWorkbenchProps {
	/** The room whose dock to show, else the room in context; it owns the dock while this view is hidden. */
	room?: RoomStore;
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
export const RoomWorkbench = ({
	room: roomProp,
	newRoomPanels,
}: RoomWorkbenchProps) => {
	const room = useRoomOrContext(roomProp);
	const sidebarSnapshot = useRoomSelector(
		room,
		(current) => current.sidebarSnapshot,
	);
	const { t } = useTranslation("connectors");
	const { t: tRoom } = useTranslation("room");
	const isMobile = useIsMobile();
	// a new chat queues Add to Context on its draft, not the room it prepared
	const nextMessageRoom = useNextMessageRoom() ?? room;
	const localFolders = room.localFolders;
	const fileSources = useRoomFileSources(localFolders);
	const explorerHost = useMemo<FileExplorerHost>(() => {
		/**
		 * Run a desktop action, telling the user when it fails.
		 *
		 * @param run - The action.
		 */
		const report = async (run: () => Promise<void>) => {
			try {
				await run();
			} catch (error) {
				toast.error(
					tRoom("localFolders.openFailed", {
						message: getErrorMessage(error, ""),
					}),
				);
			}
		};

		return {
			// an open Desktop file opens in place, so what the other app
			// saves comes back to the tab through the folder's watch
			fileActions: ({ mode, path }) =>
				mode.type === "MOUNT" && localFolders
					? [
							{
								name: tRoom("localFolders.openWithApp"),
								icon: ExternalLinkIcon,
								action: () =>
									report(() =>
										localFolders.open(mode.mountId, path),
									),
							},
						]
					: [],
			secondaryActions: (item, mode) => {
				if (mode.type !== "MOUNT") {
					return item.type === "directory"
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
							];
				}
				if (!localFolders) {
					return [];
				}
				const folderId = mode.mountId;
				const actions: FileExplorerSecondaryAction[] = [
					{
						name: tRoom("localFolders.reveal", {
							fileManager: localFolders.fileManagerName,
						}),
						action: () =>
							report(() =>
								localFolders.reveal(folderId, item.path),
							),
					},
				];
				if (item.type === "directory") {
					return actions;
				}
				return [
					{
						name: tRoom("localFolders.openWithApp"),
						action: () =>
							report(() =>
								localFolders.open(folderId, item.path),
							),
					},
					...actions,
					{
						// a message's media is a path in Room Files, so the
						// file goes there as a copy first
						name: t("actions.addToContext"),
						placement: "end",
						action: () =>
							report(async () => {
								const bytes = await localFolders
									.sourceFor(folderId)
									.read(item.path);
								const [uploaded] = await uploadTurnFiles(
									room.insightId,
									[
										new File(
											[new Uint8Array(bytes)],
											item.name,
										),
									],
								);
								if (uploaded) {
									nextMessageRoom.contextItems.add({
										path: uploaded.fileLocation,
										name: uploaded.fileName,
									});
									room.refreshSidebarFileExplorer();
								}
							}),
					},
				];
			},
		};
	}, [localFolders, nextMessageRoom, room, t, tRoom]);
	// The rail, drawn in whichever border slot holds it. A left rail opens its
	// labels and menu into the dock; the mobile toolbar sits above the tabs,
	// so there they open downward.
	const panelRail = ({ vertical }: { vertical: boolean }) => (
		<RoomWorkbenchRail
			room={room}
			newRoomPanels={newRoomPanels}
			side={vertical ? "right" : "bottom"}
		/>
	);
	const workbench = (
		<Workbench
			snapshot={sidebarSnapshot}
			borderSlots={
				isMobile
					? { top: { before: panelRail } }
					: { left: { before: panelRail } }
			}
			mobileTopBorder="toolbar"
		/>
	);
	return (
		// The workbench's absolute shell must stay inside this pane.
		<div className="relative h-full min-h-0 w-full bg-background">
			<RoomProvider room={room}>
				<WorkbenchProvider store={room.workbench}>
					<FileExplorerHostProvider host={explorerHost}>
						{fileSources ? (
							<FileSourcesProvider sources={fileSources}>
								{workbench}
							</FileSourcesProvider>
						) : (
							workbench
						)}
					</FileExplorerHostProvider>
				</WorkbenchProvider>
			</RoomProvider>
		</div>
	);
};
