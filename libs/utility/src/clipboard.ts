export interface CopyTextOptions {
	onSuccess?: () => void;
	onError?: (message: string) => void;
}

/** Copy text and optionally report the result through caller-provided callbacks. */
export const copyTextToClipboard = async (
	text: string,
	options: CopyTextOptions = {},
): Promise<void> => {
	try {
		if (!navigator.clipboard) {
			throw new Error("Clipboard access is unavailable");
		}

		await navigator.clipboard.writeText(text);
		options.onSuccess?.();
	} catch (error) {
		const message =
			error instanceof Error && error.message
				? error.message
				: "Unable to copy content";
		if (options.onError) {
			options.onError(message);
			return;
		}
		throw error;
	}
};
