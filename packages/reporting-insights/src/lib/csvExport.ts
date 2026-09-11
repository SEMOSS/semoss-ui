type CsvRow = Record<string, unknown>;

function escapeCsvValue(value: unknown): string {
	const text = value == null ? "" : String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: CsvRow[], columns?: string[]): string {
	if (!rows.length) return "";
	const activeColumns = columns?.length ? columns : Object.keys(rows[0]);
	return [
		activeColumns.map(escapeCsvValue).join(","),
		...rows.map((row) =>
			activeColumns
				.map((column) => escapeCsvValue(row[column]))
				.join(","),
		),
	].join("\n");
}

export function downloadCsvFile(
	rows: CsvRow[],
	filename: string,
	columns?: string[],
): boolean {
	const csv = toCsv(rows, columns);
	if (!csv) return false;

	const objectUrl = URL.createObjectURL(
		new Blob([csv], { type: "text/csv;charset=utf-8;" }),
	);
	const link = Object.assign(document.createElement("a"), {
		href: objectUrl,
		download: filename.toLowerCase().endsWith(".csv")
			? filename
			: `${filename}.csv`,
	});
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(objectUrl);
	return true;
}

export function sanitizeFilenamePart(value: string): string {
	return Array.from(value)
		.map((character) =>
			character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character)
				? "_"
				: character,
		)
		.join("")
		.replace(/[. ]+$/g, "")
		.trim();
}

export function formatLocalCsvTimestamp(date = new Date()): string {
	const pad = (value: number) => String(value).padStart(2, "0");
	return [
		date.getFullYear(),
		pad(date.getMonth() + 1),
		pad(date.getDate()),
		pad(date.getHours()),
		pad(date.getMinutes()),
		pad(date.getSeconds()),
	].join("-");
}

export function buildReportingCsvFilename(
	databaseName?: string,
	databaseId?: string,
	date = new Date(),
): string {
	const database =
		sanitizeFilenamePart(databaseName || databaseId || "Database") ||
		"Database";
	return `Semoss Reporting Insights - ${database}-${formatLocalCsvTimestamp(date)}.csv`;
}
