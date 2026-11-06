import { useMemo } from "react";
import type { ToolViewHost, ToolViewSavedFile } from "@semoss/shared";
import { useRoom } from "../../contexts/room.context";
import { type RoomSavedFile, useRoomFileHost } from "./use-room-file-host";

/**
 * A file a tool view saved, in the form the room's queue takes it.
 *
 * @param file - The saved file.
 * @return The file, with the source it came from.
 */
const toRoomFile = (file: ToolViewSavedFile): RoomSavedFile => ({
	path: file.path,
	name: file.name,
	service: file.source,
});

/**
 * What the room gives a `component://` view: saves land in the chat's files,
 * adding to context queues them for the next message, and signing in goes
 * through the room's integration whose view it is, such as the connectors
 * for a mail view whose `provider` names the account.
 *
 * @param params - The view's URI parameters.
 * @return The view's host.
 */
export const useRoomToolViewHost = (
	params: Readonly<Record<string, string>>,
): ToolViewHost => {
	const room = useRoom();
	const { saveTargetName, onSaved, onAddToContext } = useRoomFileHost();
	const integrations = room.integrations;
	return useMemo(() => {
		const onSignIn = integrations
			.map((integration) => integration.getToolViewSignIn?.(params))
			.find((signIn) => signIn !== undefined);
		return {
			saveTargetName: saveTargetName,
			onSignIn: onSignIn,
			onSaved: (file: ToolViewSavedFile) => onSaved(toRoomFile(file)),
			onAddToContext: (file: ToolViewSavedFile) =>
				onAddToContext(toRoomFile(file)),
		};
	}, [integrations, params, saveTargetName, onSaved, onAddToContext]);
};
