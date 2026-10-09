/** The account a viewer reads with. */
export type ConnectorAccount = "microsoft" | "google";

/** The Microsoft 365 and Google Workspace apps a connector viewer can browse. */
export type ConnectorViewerService =
	| "onedrive"
	| "outlook-mail"
	| "outlook-calendar"
	| "teams-channels"
	| "teams-files"
	| "teams-chats"
	| "google-drive"
	| "gmail"
	| "google-calendar"
	| "google-docs";

/**
 * An item a viewer saved into the current insight's files: a downloaded file,
 * or an email, message, or event written out as Markdown.
 */
export interface ConnectorSavedFile {
	/**
	 * Where the file is, relative to the insight's folder. This is the form a
	 * message's `media` takes, so the file can be attached as it is.
	 */
	path: string;
	/** The file's name in the insight's files. */
	name: string;
	/** The viewer it came from. */
	service: ConnectorViewerService;
}

/** What a host gives every connector viewer. */
export interface ConnectorViewerProps {
	/**
	 * Prepare the host before a save, such as binding a draft to its room.
	 * An optional release function keeps that host alive through the save and
	 * its completion callback, and is called on success or failure.
	 */
	// biome-ignore lint/suspicious/noConfusingVoidType: an async host may prepare without returning a release callback.
	prepareSave?: () => Promise<void | (() => void)>;
	/**
	 * What the host calls the insight's files, such as `Chat files`. It names
	 * the save action, which always saves into the current insight.
	 */
	saveTargetName?: string;
	/**
	 * Called once an item is saved into the insight's files. Without it, the
	 * viewer confirms the save itself.
	 */
	onSaved?: (file: ConnectorSavedFile) => void;
	/**
	 * Add a saved item to the conversation, for example to the next message.
	 * The viewer saves the item first. The action only shows when this is
	 * given.
	 */
	onAddToContext?: (file: ConnectorSavedFile) => void;
	/**
	 * Start signing in to the viewer's account. It runs inside a click, so it must open
	 * its window before its first await. Resolves to whether the account is
	 * connected afterwards, and the viewer loads again when it is. Without it,
	 * the viewer only explains that a sign in is needed.
	 */
	onSignIn?: () => Promise<boolean>;
	/**
	 * Whether the viewer shows its header row: the app's logo and name, where
	 * it is, and its refresh. A host that already names the viewer, such as in
	 * a tab, can leave it out, and the refresh then sits at the end of the
	 * viewer's own toolbar. Defaults to true.
	 */
	showHeader?: boolean;
}
