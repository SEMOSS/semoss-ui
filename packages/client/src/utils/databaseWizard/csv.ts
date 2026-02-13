export type CsvPreview = {
	headers: string[];
	rows: string[][];
};

export type CsvData = {
	headers: string[];
	rows: string[][];
};

export const normalizeCsvHeader = (value: string, fallback: string) => {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	return normalized || fallback;
};

export const parseCsvData = (text: string, delimiter = ","): CsvData => {
	const lines = text
		.split(/\r\n|\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length === 0) {
		return { headers: [], rows: [] };
	}

	const headers = lines[0].split(delimiter).map((value) => value.trim());
	const rows = lines
		.slice(1)
		.map((line) => line.split(delimiter).map((value) => value.trim()));

	return { headers, rows };
};

export const parseCsvPreview = (
	text: string,
	delimiter = ",",
	maxRows = 5,
): CsvPreview => {
	const parsed = parseCsvData(text, delimiter);
	return {
		headers: parsed.headers,
		rows: parsed.rows.slice(0, maxRows),
	};
};

const isNumber = (value: string) => {
	if (value.trim() === "") return false;
	return !Number.isNaN(Number(value));
};

const isBoolean = (value: string) => {
	const normalized = value.trim().toLowerCase();
	return normalized === "true" || normalized === "false";
};

const isIsoDate = (value: string) => {
	return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
};

export const inferColumnTypes = (rows: string[][], headers: string[]) => {
	const columnValues = headers.map((_, index) =>
		rows.map((row) => row[index] ?? "").filter(Boolean),
	);

	return columnValues.reduce<Record<string, string>>((acc, values, index) => {
		const header = headers[index];
		if (values.length === 0) {
			acc[header] = "TEXT";
			return acc;
		}

		const allNumbers = values.every(isNumber);
		const allBooleans = values.every(isBoolean);
		const allDates = values.every(isIsoDate);

		if (allBooleans) {
			acc[header] = "BOOLEAN";
		} else if (allDates) {
			acc[header] = "DATE";
		} else if (allNumbers) {
			acc[header] = "DOUBLE";
		} else {
			acc[header] = "TEXT";
		}

		return acc;
	}, {});
};
