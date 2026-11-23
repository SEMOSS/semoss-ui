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
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import { ConnectorPanelIcon } from "./connector-panel-icon";
import { getConnectorSource } from "./connector-sources";
import { ConnectorViewerPanel } from "./connector-viewer-panel";

/**
 * The Workbench blueprint for one viewer: one instance per room, kept alive so
 * the viewer holds its place while other tabs are in front.
 *
 * @param service - The viewer's service.
 * @param render - Shows the shared viewer with the props the room gives it.
 * @param name - The tab's default name; the room passes a translated one.
 * @returns The blueprint.
 */
const createViewerPanel = (
	service: ConnectorViewerService,
	render: (props: ConnectorViewerProps) => ReactNode,
	name: string,
): WorkbenchPanelConfig => {
	const { brand, provider } = getConnectorSource(service);
	return {
		name,
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

/**
 * Every connector viewer's blueprint, by the room panel type that opens it.
 * Module scope matters: blueprint identity churn remounts panels.
 */
export const CONNECTOR_VIEWER_PANELS: Record<string, WorkbenchPanelConfig> = {
	[ROOM_PANEL_TYPES.ONEDRIVE]: createViewerPanel(
		"onedrive",
		(props) => <OneDriveViewer {...props} />,
		"OneDrive",
	),
	[ROOM_PANEL_TYPES.OUTLOOK_MAIL]: createViewerPanel(
		"outlook-mail",
		(props) => <MailboxView {...props} provider="microsoft" />,
		"Outlook Mail",
	),
	[ROOM_PANEL_TYPES.OUTLOOK_CALENDAR]: createViewerPanel(
		"outlook-calendar",
		(props) => <CalendarAgendaView {...props} provider="microsoft" />,
		"Outlook Calendar",
	),
	[ROOM_PANEL_TYPES.TEAMS_CHANNELS]: createViewerPanel(
		"teams-channels",
		(props) => <TeamsChannelViewer {...props} />,
		"Teams channels",
	),
	[ROOM_PANEL_TYPES.TEAMS_FILES]: createViewerPanel(
		"teams-files",
		(props) => <TeamsFilesViewer {...props} />,
		"Teams files",
	),
	[ROOM_PANEL_TYPES.TEAMS_CHATS]: createViewerPanel(
		"teams-chats",
		(props) => <TeamsChatViewer {...props} />,
		"Teams chats",
	),
	[ROOM_PANEL_TYPES.GOOGLE_DRIVE]: createViewerPanel(
		"google-drive",
		(props) => <GoogleDriveViewer {...props} />,
		"Google Drive",
	),
	[ROOM_PANEL_TYPES.GMAIL]: createViewerPanel(
		"gmail",
		(props) => <MailboxView {...props} provider="google" />,
		"Gmail",
	),
	[ROOM_PANEL_TYPES.GOOGLE_CALENDAR]: createViewerPanel(
		"google-calendar",
		(props) => <CalendarAgendaView {...props} provider="google" />,
		"Google Calendar",
	),
	[ROOM_PANEL_TYPES.GOOGLE_DOCS]: createViewerPanel(
		"google-docs",
		(props) => <GoogleDocsViewer {...props} />,
		"Google Docs",
	),
};
