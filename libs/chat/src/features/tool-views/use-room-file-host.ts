import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { useRoom } from "../../contexts/room.context";
import { useNextMessageRoom } from "../conversation/next-message-room.context";

/**
 * A file saved into the chat's files, with the source it came from, such as
 * a connector viewer, when the saver says.
 */
export interface RoomSavedFile {
	/** Its path in the chat's files. */
	path: string;
	/** Its name. */
	name: string;
	/** Where it came from, such as `gmail`; marks it in the next message. */
	service?: string;
}

/** What the room gives a view that saves into the chat's files. */
export interface RoomFileHost {
	/** What the room calls its files, such as `Chat files`. */
	saveTargetName: string;
	/** Called once an item is saved into the chat's files. */
	onSaved: (file: RoomSavedFile) => void;
	/** Saves an item into the chat's files and queues it for the next message. */
	onAddToContext: (file: RoomSavedFile) => void;
}

/**
 * Saving into the nearest room's files, for a view such as a tool view or a
 * connector viewer. Saved items land in the chat's own files, the same place
 * uploads go, and the files explorer is refreshed to show them. Adding to
 * context also queues the file for the next message, where it shows as a
 * chip in the input — the draft's, on the new-chat page.
 *
 * @returns The room's file host.
 */
export const useRoomFileHost = (): RoomFileHost => {
	const room = useRoom();
	// on the new-chat page the draft's input holds the queue
	const nextMessageRoom = useNextMessageRoom() ?? room;
	const { t } = useTranslation("chatConnectors");
	const { t: tRoom } = useTranslation("room");
	const chatFilesName = tRoom("menuFileExplorer.name");

	const onSaved = useCallback(
		(file: RoomSavedFile) => {
			room.refreshSidebarFileExplorer();
			toast.success(
				t("sources.saved", { name: file.name, target: chatFilesName }),
				{
					action: {
						label: t("sources.show"),
						onClick: () => room.openSidebarFileExplorer("/"),
					},
				},
			);
		},
		[chatFilesName, room, t],
	);

	const onAddToContext = useCallback(
		(file: RoomSavedFile) => {
			room.refreshSidebarFileExplorer();
			if (!nextMessageRoom.shouldAttachToModel(file.name)) {
				toast.error(
					t("sources.notAccepted", {
						name: file.name,
						target: chatFilesName,
					}),
				);
				return;
			}
			nextMessageRoom.contextItems.add(file);
			toast.success(t("sources.added", { name: file.name }));
		},
		[chatFilesName, nextMessageRoom, room, t],
	);

	return {
		saveTargetName: chatFilesName,
		onSaved: onSaved,
		onAddToContext: onAddToContext,
	};
};
