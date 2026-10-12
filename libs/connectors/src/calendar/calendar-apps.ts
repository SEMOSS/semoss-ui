import type { ConnectorBrand } from "@semoss/shared";
import type {
	ConnectorAccount,
	ConnectorViewerService,
} from "../core/connector.types";
import { type CalendarPixels, calendarPixels } from "./calendar.pixels";

/** What tells one calendar apart from another; everything else is shared. */
export interface CalendarApp {
	/** The account the calendar signs in with. */
	account: ConnectorAccount;
	/** The service saves are made for. */
	service: ConnectorViewerService;
	/** The logo the header shows. */
	brand: ConnectorBrand;
	/** The string key of the viewer's name, such as `Outlook Calendar`. */
	nameKey: string;
	/** The string key of the app an event opens in, such as `Outlook`. */
	appNameKey: string;
	/** The app's name in saved files, which are written in English. */
	sourceName: string;
	/** The calendar's reactor calls. */
	pixels: CalendarPixels;
}

/** Each calendar the calendar viewers can read, by the account it signs in with. */
export const CALENDAR_APPS: Record<ConnectorAccount, CalendarApp> = {
	microsoft: {
		account: "microsoft",
		service: "outlook-calendar",
		brand: "outlook-calendar",
		nameKey: "services.outlookCalendar",
		appNameKey: "services.outlook",
		sourceName: "Outlook calendar",
		pixels: calendarPixels("MicrosoftCalendar"),
	},
	google: {
		account: "google",
		service: "google-calendar",
		brand: "google-calendar",
		nameKey: "services.googleCalendar",
		appNameKey: "services.googleCalendar",
		sourceName: "Google Calendar",
		pixels: calendarPixels("GoogleCalendar"),
	},
};
