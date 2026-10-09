import type { ReactNode } from "react";
import {
	CalendarAgendaView,
	type ConnectorViewerProps,
	type ConnectorViewerService,
	GoogleDocsViewer,
	GoogleDriveViewer,
	MailboxView,
	OneDriveViewer,
	TeamsChannelViewer,
	TeamsChatViewer,
	TeamsFilesViewer,
} from "@semoss/connectors";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { getConnectorSource } from "../sources/connector-sources";
import { ConnectorPanelIcon } from "./connector-panel-icon";
import { ConnectorViewerPanel } from "./connector-viewer-panel";

/**
 * The sidebar blueprint for one viewer: one instance per room, kept alive so
 * the viewer holds its place while other tabs are in front.
 *
 * @param service - The viewer's service.
 * @param render - Shows the shared viewer with the props the room gives it.
 * @param name - The tab's default name; the room passes a translated one.
 * @return The blueprint.
 */
const createViewerPanel = (
	service: ConnectorViewerService,
	render: (props: ConnectorViewerProps) => ReactNode,
	name: string,
): WorkbenchPanelConfig => {
	const { brand, provider } = getConnectorSource(service);
	return {
		name: name,
		icon: ({ id, className }) => (
			<ConnectorPanelIcon id={id} brand={brand} className={className} />
		),
		canRename: false,
		mount: "keepAlive",
		content: () => (
			<ConnectorViewerPanel render={render} provider={provider} />
		),
	};
};

/** The user's OneDrive. */
export const ONEDRIVE_PANEL = createViewerPanel(
	"onedrive",
	(props) => <OneDriveViewer {...props} />,
	"OneDrive",
);

/** The user's Outlook mail. */
export const OUTLOOK_MAIL_PANEL = createViewerPanel(
	"outlook-mail",
	(props) => <MailboxView {...props} provider="microsoft" />,
	"Outlook Mail",
);

/** The user's Outlook calendar. */
export const OUTLOOK_CALENDAR_PANEL = createViewerPanel(
	"outlook-calendar",
	(props) => <CalendarAgendaView {...props} provider="microsoft" />,
	"Outlook Calendar",
);

/** The user's Teams channels and their threads. */
export const TEAMS_CHANNELS_PANEL = createViewerPanel(
	"teams-channels",
	(props) => <TeamsChannelViewer {...props} />,
	"Teams channels",
);

/** The files shared in the user's Teams channels. */
export const TEAMS_FILES_PANEL = createViewerPanel(
	"teams-files",
	(props) => <TeamsFilesViewer {...props} />,
	"Teams files",
);

/** The user's Google Drive. */
export const GOOGLE_DRIVE_PANEL = createViewerPanel(
	"google-drive",
	(props) => <GoogleDriveViewer {...props} />,
	"Google Drive",
);

/** The user's Gmail. */
export const GMAIL_PANEL = createViewerPanel(
	"gmail",
	(props) => <MailboxView {...props} provider="google" />,
	"Gmail",
);

/** The user's Google Calendar. */
export const GOOGLE_CALENDAR_PANEL = createViewerPanel(
	"google-calendar",
	(props) => <CalendarAgendaView {...props} provider="google" />,
	"Google Calendar",
);

/** The user's Google Docs. */
export const GOOGLE_DOCS_PANEL = createViewerPanel(
	"google-docs",
	(props) => <GoogleDocsViewer {...props} />,
	"Google Docs",
);

/** The user's Teams chats. */
export const TEAMS_CHATS_PANEL = createViewerPanel(
	"teams-chats",
	(props) => <TeamsChatViewer {...props} />,
	"Teams chats",
);
