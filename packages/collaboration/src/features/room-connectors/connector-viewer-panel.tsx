import { type ComponentType, useState } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import { FILE_PANEL_EVENTS, type FilesChangedEvent } from "@semoss/panels";
import { Spinner } from "@semoss/ui/next";
import { useWorkbenchEvent, type WorkbenchPanelProps } from "@semoss/workbench";
import type { ConnectorPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/**
 * A dock tab for a Microsoft 365 viewer that needs nothing but the chat's
 * host: its files save into the chat, and Add to chat queues them for the
 * next message.
 *
 * The viewer is told to read again when a run finishes, since the assistant
 * may have written to the drive it shows.
 *
 * @param Viewer - The viewer, such as OneDrive or Teams chats.
 * @returns The panel component.
 */
export function connectorViewerPanel(
	Viewer: ComponentType<ConnectorViewerProps>,
): ComponentType<WorkbenchPanelProps> {
	return function ConnectorViewerPanel({ id }: WorkbenchPanelProps) {
		const { host, isReady } = useConnectorPanel<ConnectorPanelConfig>(id);
		const [refreshRequestId, setRefreshRequestId] = useState(0);
		// a finished run announces the chat's files without naming any; a save
		// from a viewer names its file, and changes nothing in the drive
		useWorkbenchEvent<FilesChangedEvent>(
			FILE_PANEL_EVENTS.FILES_CHANGED,
			(changed) => {
				if (!changed.paths)
					setRefreshRequestId((previous) => previous + 1);
			},
		);
		if (!isReady) return <Spinner className="m-4" />;
		return <Viewer {...host} refreshRequestId={refreshRequestId} />;
	};
}
