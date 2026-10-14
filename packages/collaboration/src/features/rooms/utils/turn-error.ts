const LIMIT = 160;

/** One readable line for a failed turn; the raw provider text stays behind Details. */
export function turnErrorSummary(error: string): string {
	const code = /Error code: (\d{3})/.exec(error)?.[1];
	if (code === "400") return "The model rejected this request (400).";
	if (code === "401" || code === "403")
		return `The model refused access (${code}).`;
	if (code === "413") return "The request was too large for the model (413).";
	if (code === "429")
		return "The model is over its rate limit (429). Try again in a moment.";
	if (code?.startsWith("5"))
		return `The model service failed (${code}). Try again in a moment.`;
	const first = error.trim().split("\n")[0] ?? "";
	return first.length > LIMIT ? `${first.slice(0, LIMIT - 3)}...` : first;
}
