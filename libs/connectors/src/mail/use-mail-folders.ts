import { useTranslation } from "@semoss/i18n";
import type { ConnectorAccount } from "../core/connector.types";
import {
	type ConnectorQuery,
	useConnectorQuery,
} from "../core/use-connector-query";
import { orderMailFolders } from "./mail.folders";
import { parseMailFolders } from "./mail.parsers";
import type { MailFolder } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";

/** A mailbox's folder listing, and its folders in the order a mail app shows them. */
export interface MailFolders extends ConnectorQuery<MailFolder[]> {
	/**
	 * The inbox first, under its well known name and followed by the folders
	 * inside it, then every other folder, each right after the one it sits in.
	 * Only the inbox until the listing is read.
	 */
	folders: MailFolder[];
}

/**
 * Read the places a mailbox files mail, nested ones included, for a folder
 * picker or a folder tree.
 *
 * @param provider - The account whose mailbox is read, or null to read none
 * yet, which leaves the listing idle.
 * @return The listing and the ordered folders.
 */
export const useMailFolders = (
	provider: ConnectorAccount | null,
): MailFolders => {
	const { t } = useTranslation("connectors");
	const query = useConnectorQuery(
		provider ? MAIL_APPS[provider].pixels.listFolders() : null,
		parseMailFolders,
	);
	return {
		...query,
		folders: orderMailFolders(query.data ?? [], t("mail.inbox")),
	};
};
