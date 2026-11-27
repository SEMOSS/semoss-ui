import { useContext, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
	type FileSources,
	FileSourcesProvider,
} from "@semoss/panels";
import type { FileExplorerSecondaryAction, FileSource } from "@semoss/shared";
import { toast, useIsMobile } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { ChatConfigContext } from "../chat/config/chat-config.context";
import { useNextMessageRoom } from "../conversation/attachments/next-message-room.context";
import { RoomProvider, useRoomOrContext } from "../room/scope/room.context";
import type { RoomStore } from "../room/store/room.store";
import { uploadTurnFiles } from "../room/store/room-turn-files";
import { useRoomSelector } from "../room/store/use-room-selector";
import { normalizeFolderPath } from "../tools/chat-tools/folder-path";
import { RoomWorkbenchRail } from "./rail/room-workbench-rail";
import type { DraftWorkbenchPanels } from "./rail/use-workbench-panels";

/** Props for {@link RoomWorkbench}. */
interface RoomWorkbenchProps {
	/** The room whose dock to show, else the room in context; it owns the dock while this view is hidden. */
	room?: RoomStore;
	/** A new chat's own panel actions, which prepare its room, until its first message. */
	draftPanels?: DraftWorkbenchPanels;
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
	draftPanels,
}: RoomWorkbenchProps) => {
	const room = useRoomOrContext(roomProp);
	const workbenchSnapshot = useRoomSelector(
		room,
		(current) => current.workbenchSnapshot,
	);
	const { t } = useTranslation("connectors");
	const { t: tRoom } = useTranslation("room");
	const isMobile = useIsMobile();
	// a new chat queues Add to Context on its draft, not the room it prepared
	const nextMessageRoom = useNextMessageRoom() ?? room;
	// the host's own sources, such as the desktop app's folders, read again
	// whenever the room changes, as when the host says they changed
	// (`toolsHostVersion`); the host returns the same object while they are
	const hostFiles = useRoomSelector(
		room,
		(current) => room.toolsHost?.files?.(current.roomId) ?? null,
	);
	// read without `useChatConfig`, so the Workspace also renders with no host config
	const FileRoots =
		useContext(ChatConfigContext)?.components?.WorkbenchFileRoots;
	const fileSources = useMemo<FileSources | null>(
		() =>
			hostFiles
				? {
						primaryLabel: tRoom("files.room"),
						// the room's own Files, not another explorer such as a connector's
						isShownIn: (mode) => mode.type === "INSIGHT",
						missingMountMessage: hostFiles.missingMountMessage,
					}
				: null,
		[hostFiles, tRoom],
	);
	const explorerHost = useMemo<FileExplorerHost>(() => {
		/**
		 * Copy a file from one of the host's mounts to Room Files and queue
		 * it for the next message: a message's media is a path in Room Files.
		 *
		 * @param source - The mount's source.
		 * @param item - The file.
		 */
		const addMountFileToContext = async (
			source: FileSource,
			item: { path: string; name: string },
		): Promise<void> => {
			try {
				const bytes = await source.read(item.path);
				const [uploaded] = await uploadTurnFiles(room.insightId, [
					new File([new Uint8Array(bytes)], item.name),
				]);
				if (uploaded) {
					nextMessageRoom.contextItems.add({
						path: uploaded.fileLocation,
						name: uploaded.fileName,
					});
					room.refreshWorkbenchFileExplorer();
				}
			} catch (error) {
				toast.error(
					tRoom("files.actionFailed", {
						message: getErrorMessage(error, ""),
					}),
				);
			}
		};

		return {
			fileActions: (context) =>
				context.mode.type === "MOUNT"
					? (hostFiles?.fileActions?.(context) ?? [])
					: [],
			secondaryActions: (item, mode, explorer) => {
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
				const actions: FileExplorerSecondaryAction[] = [
					...(hostFiles?.secondaryActions?.(item, mode, explorer) ??
						[]),
				];
				const { source } = explorer;
				if (item.type !== "directory" && source) {
					actions.push({
						name: t("actions.addToContext"),
						placement: "end",
						action: () => addMountFileToContext(source, item),
					});
				}
				return actions;
			},
		};
	}, [hostFiles, nextMessageRoom, room, t, tRoom]);
	// The rail, drawn in whichever border slot holds it. A left rail opens its
	// labels and menu into the dock; the mobile toolbar sits above the tabs,
	// so there they open downward.
	const panelRail = ({ vertical }: { vertical: boolean }) => (
		<RoomWorkbenchRail
			room={room}
			draftPanels={draftPanels}
			side={vertical ? "right" : "bottom"}
		/>
	);
	const workbench = (
		<Workbench
			snapshot={workbenchSnapshot}
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
								{FileRoots ? <FileRoots /> : null}
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
