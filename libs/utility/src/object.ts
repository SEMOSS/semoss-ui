/** Deep-copy plain values while preserving Date instances. */
export const deepCopy = <T>(
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
			deepCopy(value, intercept),
		) as unknown as T;
	}

	if (intercepted instanceof Object) {
		const copied: Record<string, unknown> = {};
		for (const key in intercepted) {
			copied[key] = deepCopy(
				(intercepted as Record<string, unknown>)[key],
				intercept,
			);
		}
		return copied as T;
	}

	return intercepted;
};

/** True for a non-null object other than an array, including class instances. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Whether two values are the same, or objects or arrays of the same kind
 * holding the same entries. Entries are compared by identity, not deeply.
 *
 * @param a - One value.
 * @param b - The other value.
 * @returns True when nothing a reader of the top level could see differs.
 */
export const isShallowEqual = (a: unknown, b: unknown): boolean => {
	if (Object.is(a, b)) {
		return true;
	}

	// only two objects of the same kind can hold the same entries
	if (
		typeof a !== "object" ||
		typeof b !== "object" ||
		a === null ||
		b === null ||
		Array.isArray(a) !== Array.isArray(b)
	) {
		return false;
	}

	const aKeys = Object.keys(a);
	if (aKeys.length !== Object.keys(b).length) {
		return false;
	}
	return aKeys.every(
		(key) =>
			Object.hasOwn(b, key) &&
			Object.is(
				(a as Record<string, unknown>)[key],
				(b as Record<string, unknown>)[key],
			),
	);
};
