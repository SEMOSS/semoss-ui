import type { ConnectorBrand } from "@semoss/shared";
import type {
	ConnectorAccount,
	ConnectorViewerService,
} from "../core/connector.types";
import { type MailPixels, mailPixels } from "./mail.pixels";

/** What tells one mailbox apart from another; everything else is shared. */
export interface MailApp {
	/** The account the mailbox signs in with. */
	account: ConnectorAccount;
	/** The service saves are made for. */
	service: ConnectorViewerService;
	/** The logo the header shows. */
	brand: ConnectorBrand;
	/** The string key of the viewer's name, such as `Outlook Mail`. */
	nameKey: string;
	/** The string key of the app an email opens in, such as `Outlook`. */
	appNameKey: string;
	/** The app's name in saved files, which are written in English. */
	sourceName: string;
	/** The mailbox's reactor calls. */
	pixels: MailPixels;
}

/** Each mailbox the mail viewers can read, by the account it signs in with. */
export const MAIL_APPS: Record<ConnectorAccount, MailApp> = {
	microsoft: {
		account: "microsoft",
		service: "outlook-mail",
		brand: "outlook",
		nameKey: "services.outlookMail",
		appNameKey: "services.outlook",
		sourceName: "Outlook",
		pixels: mailPixels("MicrosoftOutlook"),
	},
	google: {
		account: "google",
		service: "gmail",
		brand: "gmail",
		nameKey: "services.gmail",
		appNameKey: "services.gmail",
		sourceName: "Gmail",
		pixels: mailPixels("GoogleGmail"),
	},
};
