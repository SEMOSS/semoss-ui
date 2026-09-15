export function normalizeBrowserUrl(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
		return trimmed;
	}
	return `https://${trimmed}`;
}
