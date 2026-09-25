/** Normalize an unknown thrown value into an Error. */
export const toError = (value: unknown): Error =>
	value instanceof Error ? value : new Error(String(value));
