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

/** Deep-copy plain values while preserving Date instances. */
export const copy = <T>(
	instance: T,
	intercept: (value: unknown) => unknown = (value) => value,
): T => {
	const intercepted = intercept(instance) as T;

	if (!intercepted) {
		return intercepted;
	}

	if (intercepted instanceof Date) {
		return new Date(intercepted.getTime()) as unknown as T;
	}

	if (Array.isArray(intercepted)) {
		return intercepted.map((value) =>
			copy(value, intercept),
		) as unknown as T;
	}

	if (intercepted instanceof Object) {
		const copied: Record<string, unknown> = {};
		for (const key in intercepted) {
			copied[key] = copy(
				(intercepted as Record<string, unknown>)[key],
				intercept,
			);
		}
		return copied as T;
	}

	return intercepted;
};

/** True for a non-empty array of flat objects suitable for table rendering. */
export const isTabularArray = (
	value: unknown,
): value is Record<string, unknown>[] => {
	if (!Array.isArray(value) || value.length === 0) return false;
	const first = value[0];
	return (
		typeof first === "object" &&
		first !== null &&
		!Array.isArray(first) &&
		Object.keys(first).length > 0 &&
		value.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				!Array.isArray(item),
		)
	);
};
