/** Shared formatting helpers. */

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", else a date. */
export function timeAgo(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "";
	const sec = Math.max(0, (Date.now() - then) / 1000);
	if (sec < 60) return "just now";
	const min = sec / 60;
	if (min < 60) return `${Math.floor(min)}m ago`;
	const hr = min / 60;
	if (hr < 24) return `${Math.floor(hr)}h ago`;
	const day = hr / 24;
	if (day < 7) return `${Math.floor(day)}d ago`;
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/** Full timestamp for tooltips/titles. */
export function fullTimestamp(iso: string): string {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}
