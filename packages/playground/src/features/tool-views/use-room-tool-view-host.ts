import { useMemo } from "react";
import type { ConnectorViewerService } from "@semoss/connectors";
import type { ToolViewHost, ToolViewSavedFile } from "@semoss/shared";
import { CONNECTOR_SOURCES } from "@/features/connectors/sources/connector-sources";
import {
	type RoomSavedFile,
	useRoomConnectorHost,
} from "@/features/connectors/sources/use-room-connector-host";

/**
 * The viewer a saved file came from, when its source names one.
 *
 * @param source - The file's source, such as `gmail`.
 * @return The viewer service, or undefined.
 */
const readViewerService = (
	source: string | undefined,
): ConnectorViewerService | undefined =>
	CONNECTOR_SOURCES.find((entry) => entry.service === source)?.service;

/**
 * A file a tool view saved, in the form the room's queue takes it.
 *
 * @param file - The saved file.
 * @return The file, with the viewer it came from.
 */
const toRoomFile = (file: ToolViewSavedFile): RoomSavedFile => ({
	path: file.path,
	name: file.name,
	service: readViewerService(file.source),
});

/**
 * What the room gives a `component://` view: saves land in the chat's files,
 * adding to context queues them for the next message, and signing in opens
 * the account the view's `provider` names.
 *
 * @param params - The view's URI parameters.
 * @return The view's host.
 */
export const useRoomToolViewHost = (
	params: Readonly<Record<string, string>>,
): ToolViewHost => {
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
