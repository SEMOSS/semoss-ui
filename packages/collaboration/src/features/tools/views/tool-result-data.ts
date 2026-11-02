import { isRecord, tryParseJson } from "@semoss/utility";

/** An object from a tool result, narrowed at the display boundary. */
export function resultRecord(
	value: unknown,
): Record<string, unknown> | undefined {
	return isRecord(value) ? value : undefined;
}

/** Tool results may be structured JSON or a plain-language acknowledgement. */
export function parseToolResult(result: string | undefined): unknown {
	if (!result?.trim()) return undefined;
	const parsed = tryParseJson(result);
	return parsed === undefined ? result : parsed;
}

/** Prefer the reactor's collection key; wrappers used by Graph are accepted as well. */
export function resultCollection(
	value: unknown,
	collection?: string,
): unknown[] | undefined {
	if (Array.isArray(value)) return value;
	const record = resultRecord(value);
	if (!record || !collection) return undefined;
	for (const key of [collection, "items", "value"])
		if (Array.isArray(record[key])) return record[key];
	return undefined;
}

/** Read a display value without stringifying objects as [object Object]. */
export function resultText(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number") return value.toLocaleString();
	if (typeof value === "boolean") return value ? "Yes" : "No";
	return "";
}

/** Human labels for data and request fields; identifiers remain available in details. */
export function toolFieldLabel(key: string): string {
	const labels: Record<string, string> = {
		inAssistant: "Used by your assistant",
		skillMd: "Instructions",
		webUrl: "Link",
		webLink: "Link",
		fromName: "From",
		fromAddress: "Email address",
		at: "Date",
		lastAt: "Last activity",
		nextAt: "Next run",
		to: "To",
		cc: "Cc",
		bcc: "Bcc",
		id: "ID",
		timezone: "Time zone",
		filePath: "File",
		textPath: "Extracted text",
		addPeople: "Add people",
		removePeople: "Remove people",
		addGoal: "Add a goal",
		addNote: "Add a note",
		completeGoalId: "Goal to complete",
		goalResolution: "How the goal was completed",
		deleteNoteId: "Note to delete",
	};
	if (labels[key]) return labels[key];
	const words = key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]/g, " ");
	return (
		words.charAt(0).toUpperCase() + words.slice(1).replace(/\bId\b/g, "ID")
	);
}

/** A meaningful heading for a row, with no fabricated entity name. */
export function resultTitle(value: unknown, index: number): string {
	const record = resultRecord(value);
	if (!record) return resultText(value) || `Item ${index + 1}`;
	for (const key of [
		"subject",
		"name",
		"displayName",
		"topic",
		"title",
		"text",
		"fileName",
		"fromName",
		"chatType",
		"id",
	]) {
		const text = resultText(record[key]);
		if (text.trim()) return text;
	}
	return `Item ${index + 1}`;
}

/** Only explicit web links can become navigation targets. */
export function resultWebLink(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
}
