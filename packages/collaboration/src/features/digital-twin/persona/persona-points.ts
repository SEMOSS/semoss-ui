/** One plain-text block. Keep its original list marker when saving an edited section. */
export interface PersonaPoint {
	text: string;
	prefix: string;
	offset: number;
}

/** Read line-start list markers; unmarked lines stay with their paragraph or preceding point. */
export function parsePersonaPoints(value: string): PersonaPoint[] {
	if (!value.trim()) return [];
	const parts = value
		.replace(/\r\n?/g, "\n")
		.split(/\n(?=[ \t]*[-*+•–—][ \t]+\S)/u);
	// A leading blank line belongs to the first marker, not its own row.
	if (!parts[0].trim()) {
		parts.splice(0, 2, `${parts[0]}\n${parts[1]}`);
	}
	let offset = 0;
	return parts.map((part) => {
		const prefix = /^[ \t\n]*[-*+•–—][ \t]+(?=\S)/u.exec(part)?.[0] ?? "";
		const point = { prefix, text: part.slice(prefix.length), offset };
		offset += part.length + 1;
		return point;
	});
}

/** Preserve prose, original markers and continuation lines in the persona's stored text format. */
export function serializePersonaPoints(
	points: Pick<PersonaPoint, "text" | "prefix">[],
): string {
	return points
		.filter(({ text }) => text.trim())
		.map(({ prefix, text }) => prefix + text)
		.join("\n");
}
