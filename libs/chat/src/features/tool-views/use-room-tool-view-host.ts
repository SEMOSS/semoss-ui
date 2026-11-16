import { useMemo } from "react";
import type { ToolViewHost, ToolViewSavedFile } from "@semoss/shared";
import { CONNECTOR_SOURCES } from "../connectors/sources/connector-sources";
import {
	type RoomSavedFile,
	useRoomConnectorHost,
} from "../connectors/sources/use-room-connector-host";

/**
 * A file a tool view saved, in the form the room's queue takes it.
 *
 * @param file - The saved file.
 * @returns The file, with the viewer it came from when its source, such as
 * `gmail`, names one.
 */
const toRoomFile = (file: ToolViewSavedFile): RoomSavedFile => ({
	path: file.path,
	name: file.name,
	service: CONNECTOR_SOURCES.find((entry) => entry.service === file.source)
		?.service,
});

/**
 * What the room gives a `component://` view: saves land in the chat's files,
 * adding to context queues them for the next message, and signing in opens
 * the account the view's `provider` names.
 *
 * @param params - The view's URI parameters.
 * @returns The view's host.
 */
export const useRoomToolViewHost = (
	params: Readonly<Record<string, string>>,
): ToolViewHost => {
	// a view names its account by `provider`; anything but google is Microsoft
	const { saveTargetName, onSaved, onAddToContext, onSignIn } =
		useRoomConnectorHost(
			params.provider === "google" ? "GOOGLE" : "MICROSOFT",
		);
	return useMemo(
		() => ({
			saveTargetName: saveTargetName,
			onSignIn: onSignIn,
			onSaved: (file: ToolViewSavedFile) => onSaved(toRoomFile(file)),
			onAddToContext: (file: ToolViewSavedFile) =>
				onAddToContext(toRoomFile(file)),
		}),
		[saveTargetName, onSaved, onAddToContext, onSignIn],
	);
};
