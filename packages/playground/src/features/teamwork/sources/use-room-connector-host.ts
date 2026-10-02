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
import {
	type ConnectorProviderId,
	getConnectorProvider,
} from "../connectors/connector.catalog";
import { signInToProvider } from "../connectors/connector-sign-in";
import { useNextMessageRoom } from "./next-message-room";

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
): ConnectorViewerProps => {
	const room = useRoom();
	// on the new-chat page the draft's input holds the queue
	const nextMessageRoom = useNextMessageRoom() ?? room;
	const { t } = useTranslation("teamwork");
	const { t: tRoom } = useTranslation("room");
	const chatFilesName = tRoom("menuFileExplorer.name");

	const onSaved = useCallback(
		(file: ConnectorSavedFile) => {
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
		(file: ConnectorSavedFile) => {
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
			nextMessageRoom.teamwork.addContextItem(file);
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
