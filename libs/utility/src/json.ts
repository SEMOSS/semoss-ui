import { isRecord } from "./object";
/** Parse object-like output, accepting the single-quote form from legacy output. */
export const isOutputJSON = (output: unknown): unknown | null => {
	if (typeof output === "object" && output !== null) {
		return output;
	}

	if (typeof output !== "string") {
		return null;
	}

	try {
		return JSON.parse(output);
	} catch {
		try {
			return JSON.parse(output.replace(/'/g, '"'));
		} catch {
			return null;
		}
	}
};

/** Parse a JSON or Python-representation object/array, or return null. */
export const parseStructuredOutput = (raw: string): unknown | null => {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (
		!(trimmed.startsWith("{") && trimmed.endsWith("}")) &&
		!(trimmed.startsWith("[") && trimmed.endsWith("]"))
	) {
		return null;
	}

	try {
		return JSON.parse(trimmed);
	} catch {
		try {
			const normalized = trimmed
				.replace(/(^|[\s,{[(])'((?:\\.|[^'\\])*)'/g, '$1"$2"')
				.replace(/\bTrue\b/g, "true")
				.replace(/\bFalse\b/g, "false")
				.replace(/\bNone\b/g, "null");
			return JSON.parse(normalized);
		} catch {
			return null;
		}
	}
};

/** True for a non-empty array of flat objects suitable for table rendering. */
export const isTabularArray = (
	value: unknown,
): value is Record<string, unknown>[] => {
	if (!Array.isArray(value) || value.length === 0) return false;
	const first = value[0];
	return (
		isRecord(first) &&
		Object.keys(first).length > 0 &&
		value.every(isRecord)
	);
};

export { copy } from "./object";

/**
 * JSON.parse error messages vary by engine. Try to extract line/col so the user
 * can find the bad character without counting bytes by hand.
 */
export const locateJsonError = (
	message: string,
	text: string,
): { line: number; col: number } | null => {
	const lineColMatch = message.match(/line (\d+) column (\d+)/i);
	if (lineColMatch) {
		return { line: Number(lineColMatch[1]), col: Number(lineColMatch[2]) };
	}

	const posMatch = message.match(/position (\d+)/i);
	if (posMatch) {
		const pos = Math.min(Number(posMatch[1]), text.length);
		let line = 1;
		let col = 1;
		for (let i = 0; i < pos; i++) {
			if (text[i] === "\n") {
				line++;
				col = 1;
			} else {
				col++;
			}
		}
		return { line, col };
	}

	return null;
};
