/**
 * Ordering helpers that make the generator's output depend only on the
 * document's content: never on the order of its keys, and never on the
 * machine's locale.
 */

/**
 * Compares two names by UTF-16 code unit. Unlike `localeCompare`, the result is
 * the same on every machine, whatever its locale.
 */
export function byName(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

/** An object's entries, sorted by key with {@link byName}. */
export function sortedEntries<T>(object: Record<string, T>): [string, T][] {
	return Object.entries(object).sort(([a], [b]) => byName(a, b));
}

/** JSON with every object's keys sorted, so equal documents serialize the same. */
export function canonicalJson(value: unknown): string {
	const sort = (v: unknown): unknown => {
		if (Array.isArray(v)) {
			return v.map(sort);
		}
		if (v !== null && typeof v === "object") {
			return Object.fromEntries(
				sortedEntries(v as Record<string, unknown>).map(
					([key, child]) => [key, sort(child)],
				),
			);
		}
		return v;
	};
	return JSON.stringify(sort(value));
}
