/**
 * Writes plain data as JSON with sorted keys, so values that are equal but built
 * in a different order give the same key. Hooks use it to compare inputs by value.
 *
 * @param where - names the value in the error for data that has no JSON form
 * @returns undefined for undefined
 * @throws TypeError for anything but strings, numbers, booleans, null, arrays and
 * plain objects
 */
export function stableKey(value: unknown, where: string): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	return JSON.stringify(sortKeys(value, where));
}

function sortKeys(value: unknown, where: string): unknown {
	if (
		value === null ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((item, i) => {
			if (item === undefined) {
				throw new TypeError(`${where}[${i}] is undefined; use null`);
			}
			return sortKeys(item, `${where}[${i}]`);
		});
	}
	if (typeof value === "object") {
		const prototype = Object.getPrototypeOf(value);
		if (prototype === Object.prototype || prototype === null) {
			const record = value as Record<string, unknown>;
			return Object.fromEntries(
				Object.keys(record)
					.sort()
					.filter((key) => record[key] !== undefined)
					.map((key) => [
						key,
						sortKeys(record[key], `${where}.${key}`),
					]),
			);
		}
	}
	throw new TypeError(
		`${where} must be plain JSON data (strings, numbers, booleans, null, arrays and plain objects)`,
	);
}
