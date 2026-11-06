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
import {
	CONNECTOR_PANEL_TYPES,
	getConnectorSource,
} from "../sources/connector-sources";
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
const ONEDRIVE_PANEL = createViewerPanel(
	"onedrive",
	(props) => <OneDriveViewer {...props} />,
	"OneDrive",
);

/** The user's Outlook mail. */
const OUTLOOK_MAIL_PANEL = createViewerPanel(
	"outlook-mail",
	(props) => <MailboxView {...props} provider="microsoft" />,
	"Outlook Mail",
);

/** The user's Outlook calendar. */
const OUTLOOK_CALENDAR_PANEL = createViewerPanel(
	"outlook-calendar",
	(props) => <CalendarAgendaView {...props} provider="microsoft" />,
	"Outlook Calendar",
);

/** The user's Teams channels and their threads. */
const TEAMS_CHANNELS_PANEL = createViewerPanel(
	"teams-channels",
	(props) => <TeamsChannelViewer {...props} />,
	"Teams channels",
);

/** The files shared in the user's Teams channels. */
const TEAMS_FILES_PANEL = createViewerPanel(
	"teams-files",
	(props) => <TeamsFilesViewer {...props} />,
	"Teams files",
);

/** The user's Google Drive. */
const GOOGLE_DRIVE_PANEL = createViewerPanel(
	"google-drive",
	(props) => <GoogleDriveViewer {...props} />,
	"Google Drive",
);

/** The user's Gmail. */
const GMAIL_PANEL = createViewerPanel(
	"gmail",
	(props) => <MailboxView {...props} provider="google" />,
	"Gmail",
);

/** The user's Google Calendar. */
const GOOGLE_CALENDAR_PANEL = createViewerPanel(
	"google-calendar",
	(props) => <CalendarAgendaView {...props} provider="google" />,
	"Google Calendar",
);

/** The user's Google Docs. */
const GOOGLE_DOCS_PANEL = createViewerPanel(
	"google-docs",
	(props) => <GoogleDocsViewer {...props} />,
	"Google Docs",
);

/** The user's Teams chats. */
const TEAMS_CHATS_PANEL = createViewerPanel(
	"teams-chats",
	(props) => <TeamsChatViewer {...props} />,
	"Teams chats",
);

/**
 * Every connector viewer's blueprint, by its panel type: what a host adds
 * to its Workspace's `panelComponents` to show the connectors' viewers.
 */
export const CONNECTOR_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfig> =
	{
		[CONNECTOR_PANEL_TYPES.ONEDRIVE]: ONEDRIVE_PANEL,
		[CONNECTOR_PANEL_TYPES.OUTLOOK_MAIL]: OUTLOOK_MAIL_PANEL,
		[CONNECTOR_PANEL_TYPES.OUTLOOK_CALENDAR]: OUTLOOK_CALENDAR_PANEL,
		[CONNECTOR_PANEL_TYPES.TEAMS_CHANNELS]: TEAMS_CHANNELS_PANEL,
		[CONNECTOR_PANEL_TYPES.TEAMS_FILES]: TEAMS_FILES_PANEL,
		[CONNECTOR_PANEL_TYPES.TEAMS_CHATS]: TEAMS_CHATS_PANEL,
		[CONNECTOR_PANEL_TYPES.GOOGLE_DRIVE]: GOOGLE_DRIVE_PANEL,
		[CONNECTOR_PANEL_TYPES.GMAIL]: GMAIL_PANEL,
		[CONNECTOR_PANEL_TYPES.GOOGLE_CALENDAR]: GOOGLE_CALENDAR_PANEL,
		[CONNECTOR_PANEL_TYPES.GOOGLE_DOCS]: GOOGLE_DOCS_PANEL,
	};
