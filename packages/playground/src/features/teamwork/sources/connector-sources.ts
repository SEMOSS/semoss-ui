import type { ConnectorViewerService } from "@semoss/connectors";
import type { ConnectorBrand } from "@semoss/shared";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type {
	ConnectorProviderId,
	ConnectorServiceId,
} from "../connectors/connector.catalog";

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
		panelType: ROOM_PANEL_TYPES.ONEDRIVE,
		brand: "onedrive",
		nameKey: "connectors:services.onedrive",
	},
	{
		service: "outlook-mail",
		provider: "MICROSOFT",
		requires: "outlook",
		panelType: ROOM_PANEL_TYPES.OUTLOOK_MAIL,
		brand: "outlook",
		nameKey: "connectors:services.outlookMail",
	},
	{
		service: "outlook-calendar",
		provider: "MICROSOFT",
		requires: "outlook-calendar",
		panelType: ROOM_PANEL_TYPES.OUTLOOK_CALENDAR,
		brand: "outlook-calendar",
		nameKey: "connectors:services.outlookCalendar",
	},
	{
		service: "teams-channels",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: ROOM_PANEL_TYPES.TEAMS_CHANNELS,
		brand: "teams",
		nameKey: "connectors:services.teamsChannels",
	},
	{
		service: "teams-files",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: ROOM_PANEL_TYPES.TEAMS_FILES,
		brand: "teams",
		nameKey: "connectors:services.teamsFiles",
	},
	{
		service: "teams-chats",
		provider: "MICROSOFT",
		requires: "teams",
		panelType: ROOM_PANEL_TYPES.TEAMS_CHATS,
		brand: "teams",
		nameKey: "connectors:services.teamsChats",
	},
	{
		service: "google-drive",
		provider: "GOOGLE",
		requires: "google-drive",
		panelType: ROOM_PANEL_TYPES.GOOGLE_DRIVE,
		brand: "google-drive",
		nameKey: "connectors:services.googleDrive",
	},
	{
		service: "gmail",
		provider: "GOOGLE",
		requires: "gmail",
		panelType: ROOM_PANEL_TYPES.GMAIL,
		brand: "gmail",
		nameKey: "connectors:services.gmail",
	},
	{
		service: "google-calendar",
		provider: "GOOGLE",
		requires: "google-calendar",
		panelType: ROOM_PANEL_TYPES.GOOGLE_CALENDAR,
		brand: "google-calendar",
		nameKey: "connectors:services.googleCalendar",
	},
	{
		service: "google-docs",
		provider: "GOOGLE",
		requires: "google-docs",
		panelType: ROOM_PANEL_TYPES.GOOGLE_DOCS,
		brand: "google-docs",
		nameKey: "connectors:services.googleDocs",
	},
];

const SOURCES_BY_SERVICE = new Map(
	CONNECTOR_SOURCES.map((source) => [source.service, source]),
);

/**
 * A viewer by the service it shows, when the room has one for it.
 *
 * @param service - The service.
 * @return Its entry, or undefined.
 */
export const findConnectorSource = (
	service: ConnectorViewerService,
): ConnectorSource | undefined => SOURCES_BY_SERVICE.get(service);

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
