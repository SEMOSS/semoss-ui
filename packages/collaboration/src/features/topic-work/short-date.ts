/** A date such as "Oct 30"; nothing when there is none or it does not read as one. */
export function shortDate(value?: string): string | null {
	if (!value) return null;
	const at = new Date(value.replace(" ", "T"));
	if (Number.isNaN(at.getTime())) return null;
	return at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
