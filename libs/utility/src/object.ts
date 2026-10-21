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
