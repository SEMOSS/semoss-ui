/** Read an Error's message, otherwise use a fallback or stringify the value. */
export const getErrorMessage = (error: unknown, fallback?: string): string =>
	error instanceof Error ? error.message : (fallback ?? String(error));
