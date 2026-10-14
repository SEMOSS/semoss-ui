import { useCallback } from "react";
import type {
	ConnectorSavedFile,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { PopupBlockedError } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useRoom } from "@/contexts/room.context";
import { useNextMessageRoom } from "@/features/conversation/next-message-room.context";
import {
	type ConnectorProviderId,
	getConnectorProvider,
} from "../connector.catalog";
import { signInToProvider } from "../connector-sign-in";

/**
 * A file saved into the chat's files. A connector's tool view may not say
 * which viewer it came from.
 */
export type RoomSavedFile = Pick<ConnectorSavedFile, "path" | "name"> &
	Partial<Pick<ConnectorSavedFile, "service">>;

/** What the room gives a connector viewer, or a connector's tool view. */
export interface RoomConnectorHost
	extends Omit<ConnectorViewerProps, "onSaved" | "onAddToContext"> {
	/** Called once an item is saved into the chat's files. */
	onSaved: (file: RoomSavedFile) => void;
	/** Saves an item into the chat's files and queues it for the next message. */
	onAddToContext: (file: RoomSavedFile) => void;
}

/**
 * What the room gives a Microsoft 365 viewer in its sidebar.
 *
 * Saved items land in the chat's own files, the same place uploads go and
 * the room's apps work, and the chat files explorer is refreshed to show
 * them. Adding to context also queues the file for the next message, where it
 * shows as a chip in the input. Signing in links the viewer's account to the
 * session in a popup.
 *
 * @param providerId - The account the viewer reads with.
 * @return The viewer's host props.
 */
export const useRoomConnectorHost = (
	providerId: ConnectorProviderId,
): RoomConnectorHost => {
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
			if (!nextMessageRoom.acceptsAttachment(file.name)) {
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

	const onSignIn = useCallback(async (): Promise<boolean> => {
		const provider = getConnectorProvider(providerId);
		const name = t(`providers.${provider.id}.name`);
		// no await before this call: the popup has to open inside the click
		const attempt = signInToProvider(providerId);
		try {
			const isConnected = await attempt;
			if (!isConnected) {
				toast.info(t("providers.connectIncomplete", { name: name }));
			}
			return isConnected;
		} catch (error) {
			toast.error(
				error instanceof PopupBlockedError
					? t("providers.popupBlocked")
					: t("providers.connectError", {
							name: name,
							message: getErrorMessage(error, ""),
						}),
			);
			return false;
		}
	}, [providerId, t]);

	return {
		saveTargetName: chatFilesName,
		onSaved: onSaved,
		onAddToContext: onAddToContext,
		onSignIn: onSignIn,
	};
};
