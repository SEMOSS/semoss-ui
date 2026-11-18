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
	/**
	 * What that viewer knows the item it was saved from by. Set on the file
	 * `onSaved` is handed, so a host can mark the item through `savedItems`.
	 */
	itemKey?: string;
}

/** Transient actions a host can display in its own viewer chrome. */
export interface ConnectorViewerControls {
	refresh?: { onRefresh: () => void; isRefreshing: boolean };
	/** Opens the host's retained calendar panel, independently of external links. */
	onOpenCalendar?: () => void;
	addToContext?: { onAddToContext: () => void; isBusy: boolean };
	openIn?: { href: string; label: string };
}

/** An explicit request to return keyboard focus to a browser item. */
export interface ConnectorFocusRequest {
	itemKey: string;
	requestId: number;
}

/** How a host marks the items it already holds, in a viewer that lists them. */
export interface ConnectorSavedItems {
	/** Whether the host holds the item, by the `itemKey` of its saved file. */
	isSaved: (itemKey: string) => boolean;
	/**
	 * What a held item says in place of the save action, such as
	 * `In your Digital Twin`.
	 */
	label: string;
}

/** What a host can also give a viewer that marks the items the host holds. */
export interface ConnectorSavedItemsProps {
	/**
	 * The items the host already holds. Each shows as held where the viewer
	 * would offer to save it: on its row, and above it once it is open. Its
	 * right-click menu still saves, since the host may have let its copy go.
	 */
	savedItems?: ConnectorSavedItems;
}

/** What a host gives every connector viewer. */
export interface ConnectorViewerProps {
	/** Prepare the originating file space; release its lifetime after the save. */
	// biome-ignore lint/suspicious/noConfusingVoidType: preserves the host's Promise<void> preparation contract
	prepareSave?: () => Promise<void | (() => void)>;
	/** Whether this retained viewer is currently visible. Defaults to true. */
	isVisible?: boolean;
	/**
	 * Raised by the host when what the viewer shows may have changed behind
	 * it, such as after an agent's run wrote to the drive. A viewer that keeps
	 * a listing reads it again each time the number changes.
	 */
	refreshRequestId?: number;
	/** Publish actions to host chrome instead of rendering their inline equivalents. */
	onControlsChange?: (controls: ConnectorViewerControls) => void;
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
	/** Open a file in the host after fetching it into the insight's files. */
	onOpenFile?: (file: ConnectorSavedFile) => void;
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
