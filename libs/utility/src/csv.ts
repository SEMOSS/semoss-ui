/** Quote a CSV cell and escape embedded quotes; nullish values stay empty. */
export const escapeCsvValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	return `"${String(value).replace(/"/g, '""')}"`;
};
