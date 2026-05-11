export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unable to copy content";
};

export const copyToClipboard = async (
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
) => {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(getErrorMessage(error));
	}
};
