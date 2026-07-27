/** Copied from playground's response-message-text/clipboard.ts — same behavior, no reason to diverge. */
export function getClipboardErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return "Unable to copy content";
}

export async function copyToClipboard(
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
): Promise<void> {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(getClipboardErrorMessage(error));
	}
}
