import type { ComponentType } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import type { ConnectorProviderId } from "../connector.catalog";
import { useRoomConnectorHost } from "../sources/use-room-connector-host";

/** Props for {@link ConnectorViewerPanel}. */
export interface ConnectorViewerPanelProps {
	/** The shared viewer to show, such as `OneDriveViewer`. */
	viewer: ComponentType<ConnectorViewerProps>;
	/** The account it reads with, which its sign in opens. */
	provider: ConnectorProviderId;
}

/**
 * A shared connector viewer in the room's sidebar, wired to the room: it
 * saves into the chat's files and adds to the next message. Its tab already
 * names it and shows its logo, so the viewer leaves its own header out.
 */
export const ConnectorViewerPanel = ({
	viewer: Viewer,
	provider,
}: ConnectorViewerPanelProps) => {
	const host = useRoomConnectorHost(provider);
	return <Viewer {...host} showHeader={false} />;
};
