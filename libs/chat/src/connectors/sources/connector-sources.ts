import type { ConnectorViewerService } from "@semoss/connectors";
import type { ConnectorBrand } from "@semoss/shared";
import type {
	ConnectorProviderId,
	ConnectorServiceId,
} from "../connector.catalog";

/** The connector viewers' panel type ids in a room's Workspace. */
export const CONNECTOR_PANEL_TYPES = {
	/** The user's OneDrive. */
	ONEDRIVE: "room-onedrive",
	/** The user's Outlook mail. */
	OUTLOOK_MAIL: "room-outlook-mail",
	/** The user's Outlook calendar. */
	OUTLOOK_CALENDAR: "room-outlook-calendar",
	/** The user's Teams channels and their threads. */
	TEAMS_CHANNELS: "room-teams-channels",
	/** The files shared in the user's Teams channels. */
	TEAMS_FILES: "room-teams-files",
	/** The user's Teams chats. */
	TEAMS_CHATS: "room-teams-chats",
	/** The user's Google Drive. */
	GOOGLE_DRIVE: "room-google-drive",
	/** The user's Gmail. */
	GMAIL: "room-gmail",
	/** The user's Google Calendar. */
	GOOGLE_CALENDAR: "room-google-calendar",
	/** The user's Google Docs. */
	GOOGLE_DOCS: "room-google-docs",
} as const;

/** A viewer the room sidebar can show. */
export interface ConnectorSource {
	service: ConnectorViewerService;
	/** The account it reads with. */
	provider: ConnectorProviderId;
	/**
	 * The connector that has to be switched on for the chat before the viewer
	 * is offered, so the viewers match what the assistant can reach.
	 */
	requires: ConnectorServiceId;
	/** The sidebar panel that shows it. */
	panelType: string;
	/**
	 * The app whose logo stands for it: on its tab, in the plus menu, and on
	 * what it adds to context.
	 */
	brand: ConnectorBrand;
	/** Its name, in the shared `connectors` namespace. */
	nameKey: string;
}

/** The viewers, in the order the plus menu lists them. */
export const CONNECTOR_SOURCES: readonly ConnectorSource[] = [
	{
		service: "onedrive",
		provider: "MICROSOFT",
		requires: "onedrive",
		panelType: CONNECTOR_PANEL_TYPES.ONEDRIVE,
		brand: "onedrive",
		nameKey: "connectors:services.onedrive",
	},
	{
		service: "outlook-mail",
		provider: "MICROSOFT",
		requires: "outlook",
		panelType: CONNECTOR_PANEL_TYPES.OUTLOOK_MAIL,
		brand: "outlook",
		nameKey: "connectors:services.outlookMail",
	},
	{
		service: "outlook-calendar",
		provider: "MICROSOFT",
		requires: "outlook-calendar",
		panelType: CONNECTOR_PANEL_TYPES.OUTLOOK_CALENDAR,
		brand: "outlook-calendar",
		nameKey: "connectors:services.outlookCalendar",
	},
	{
		service: "teams-channels",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: CONNECTOR_PANEL_TYPES.TEAMS_CHANNELS,
		brand: "teams-channels",
		nameKey: "connectors:services.teamsChannels",
	},
	{
		service: "teams-files",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: CONNECTOR_PANEL_TYPES.TEAMS_FILES,
		brand: "teams-files",
		nameKey: "connectors:services.teamsFiles",
	},
	{
		service: "teams-chats",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: CONNECTOR_PANEL_TYPES.TEAMS_CHATS,
		brand: "teams-chats",
		nameKey: "connectors:services.teamsChats",
	},
	{
		service: "google-drive",
		provider: "GOOGLE",
		requires: "google-drive",
		panelType: CONNECTOR_PANEL_TYPES.GOOGLE_DRIVE,
		brand: "google-drive",
		nameKey: "connectors:services.googleDrive",
	},
	{
		service: "gmail",
		provider: "GOOGLE",
		requires: "gmail",
		panelType: CONNECTOR_PANEL_TYPES.GMAIL,
		brand: "gmail",
		nameKey: "connectors:services.gmail",
	},
	{
		service: "google-calendar",
		provider: "GOOGLE",
		requires: "google-calendar",
		panelType: CONNECTOR_PANEL_TYPES.GOOGLE_CALENDAR,
		brand: "google-calendar",
		nameKey: "connectors:services.googleCalendar",
	},
	{
		service: "google-docs",
		provider: "GOOGLE",
		requires: "google-docs",
		panelType: CONNECTOR_PANEL_TYPES.GOOGLE_DOCS,
		brand: "google-docs",
		nameKey: "connectors:services.googleDocs",
	},
];

const SOURCES_BY_SERVICE = new Map(
	CONNECTOR_SOURCES.map((source) => [source.service, source]),
);

/**
 * A viewer by the service it shows.
 *
 * @param service - The service.
 * @return Its entry.
 * @throws Error for a service without a viewer.
 */
export const getConnectorSource = (
	service: ConnectorViewerService,
): ConnectorSource => {
	const source = SOURCES_BY_SERVICE.get(service);
	if (!source) {
		throw new Error(`No viewer shows ${service}`);
	}
	return source;
};
