export const normalizeSourceToArray = (source: string): string[] => {
	if (!source) return [];
	const lines = source.split("\n");
	return lines.map((line, idx) => {
		return idx === lines.length - 1 ? line : `${line}\n`;
	});
};

export const normalizeUnknownSourceToArray = (source: unknown): string[] => {
	if (Array.isArray(source)) {
		return source.map((line) => String(line));
	}

	if (typeof source === "string") {
		return normalizeSourceToArray(source);
	}

	if (source === undefined || source === null) {
		return [];
	}

	return normalizeSourceToArray(String(source));
};

/**
 * nbformat stores cell/output `source`/`text` as either a single string or an
 * array of lines; most rendering code just wants the joined string.
 */
export const normalizeSource = (source: string | string[]): string => {
	if (Array.isArray(source)) {
		return source.join("");
	}
	return source ?? "";
};
