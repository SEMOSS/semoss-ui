import type { ComponentType } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import { Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import type { ConnectorPanelConfig } from "./room-connectors.types";
import { useConnectorPanel } from "./use-connector-panel";

/**
 * A dock tab for a Microsoft 365 viewer that needs nothing but the chat's
 * host: its files save into the chat, and Add to chat queues them for the
 * next message.
 *
 * @param Viewer - The viewer, such as OneDrive or Teams chats.
 * @returns The panel component.
 */
export function connectorViewerPanel(
	Viewer: ComponentType<ConnectorViewerProps>,
): ComponentType<WorkbenchPanelProps> {
	return function ConnectorViewerPanel({ id }: WorkbenchPanelProps) {
		const { host, isReady } = useConnectorPanel<ConnectorPanelConfig>(id);
		if (!isReady) return <Spinner className="m-4" />;
		return <Viewer {...host} />;
	};
}
