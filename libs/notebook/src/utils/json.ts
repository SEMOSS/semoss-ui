export const isRecordObject = (
	value: unknown,
): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const toSafeJsonString = (value: unknown): string => {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};
