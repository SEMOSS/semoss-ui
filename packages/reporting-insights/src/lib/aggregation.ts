/** Whether a raw cell value counts as "present" for aggregation (excludes null/undefined/blank strings). */
export function isAggregationValuePresent(value: unknown): boolean {
	return (
		value !== null &&
		value !== undefined &&
		(typeof value !== "string" || value.trim() !== "")
	);
}

/** Filter a list of raw values down to the ones that count as present. */
export function validAggregationValues<T>(values: readonly T[]): T[] {
	return values.filter(isAggregationValuePresent);
}

/** Filter a list of raw values down to finite numbers, dropping absent/non-numeric entries first. */
export function finiteAggregationNumbers(values: readonly unknown[]): number[] {
	return validAggregationValues(values)
		.map((value) => Number(value))
		.filter(Number.isFinite);
}

/**
 * Shared aggregation for chart/table/pivot/KPI value columns. Excludes
 * null/undefined/blank-string entries before counting or averaging, so
 * `count`/`countUnique` reflect actual data rather than every row.
 */
export function aggregateNumericValues<T extends number | null>(
	values: readonly unknown[],
	aggregation: string,
	emptyValue: T,
): number | T {
	const presentValues = validAggregationValues(values);

	if (aggregation === "count") return presentValues.length;
	if (aggregation === "countUnique") return new Set(presentValues).size;

	const numbers = finiteAggregationNumbers(presentValues);
	if (!numbers.length) return emptyValue;

	switch (aggregation) {
		case "avg":
			return (
				numbers.reduce((sum, value) => sum + value, 0) / numbers.length
			);
		case "max":
			return Math.max(...numbers);
		case "min":
			return Math.min(...numbers);
		case "median": {
			const sorted = [...numbers].sort((a, b) => a - b);
			const middle = Math.floor(sorted.length / 2);
			return sorted.length % 2 === 0
				? (sorted[middle - 1] + sorted[middle]) / 2
				: sorted[middle];
		}
		case "last":
			return numbers[numbers.length - 1];
		default:
			return numbers.reduce((sum, value) => sum + value, 0);
	}
}
