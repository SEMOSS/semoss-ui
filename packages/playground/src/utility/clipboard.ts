/**
 * Copy the clipboard value to the user's clipboard, and call the appropriate callback on success or failure.
 * @param value
 * @param onSuccess
 * @param onError
 */
export const copyToClipboard = async (
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
) => {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(
			error instanceof Error && error.message
				? error.message
				: "Unable to copy content",
		);
	}
};
