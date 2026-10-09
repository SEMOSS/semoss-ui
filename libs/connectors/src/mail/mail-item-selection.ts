import type { MailConversation } from "./mail.threads";

/** The mail row to open outside its browser, without losing the list's state. */
export interface MailItemSelection {
	/** Grouped rows open a thread; individual rows open their latest message. */
	kind: "thread" | "message";
	/** The provider's conversation or message id, according to `kind`. */
	id: string;
	/** The row's subject, for the host's panel title. */
	title: string;
	/** The row's stable key, also exposed as `data-item-key` for return focus. */
	itemKey: string;
	/** The folder or label the user opened the item from. */
	folderName: string;
	/** The list data to show while the complete item is read. */
	summary: MailConversation;
}
