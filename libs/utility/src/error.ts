/** Normalize an unknown thrown value into an Error. */
export const toError = (value: unknown): Error =>
	value instanceof Error ? value : new Error(String(value));

/** Read an Error's message, otherwise use a fallback or stringify the value. */
export const getErrorMessage = (error: unknown, fallback?: string): string =>
	error instanceof Error ? error.message : (fallback ?? String(error));
