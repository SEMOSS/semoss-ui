/**
 * What can be done with an item in a viewer's list: add it to the
 * conversation, save it into the insight's files, or open it in its own app.
 * A row shows one as a button and offers all of them on a right-click, as the
 * file explorer's rows do.
 */
export interface ConnectorItemActions {
	/** The item's name, for the actions' accessible names. */
	itemName: string;
	/** Adds the item to the conversation. Left out when not given. */
	onAddToContext?: () => void;
	/** Saves the item into the insight's files. Left out when not given. */
	onSave?: () => void;
	/** The save action's label, such as `Save to Chat files`. */
	saveLabel: string;
	/** Opens the item in its own app. */
	webUrl?: string;
	/** The app's name, for the open action. */
	serviceName: string;
	/** Stops the actions while the item is being saved. */
	isBusy?: boolean;
}

/**
 * Whether an item has any action at all.
 *
 * @param actions - The item's actions.
 * @return True when one of them can run.
 */
export const hasItemActions = (
	actions: ConnectorItemActions | null | undefined,
): actions is ConnectorItemActions =>
	!!actions &&
	(!!actions.onAddToContext || !!actions.onSave || !!actions.webUrl);
