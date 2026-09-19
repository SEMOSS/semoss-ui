/**
 * Copy text and report the result without coupling the utility package to a UI
 * notification system.
 */
export const copyTextToClipboard = async (text: string): Promise<void> => {
	if (!navigator.clipboard) {
		throw new Error("Clipboard access is unavailable");
	}

	await navigator.clipboard.writeText(text);
};
