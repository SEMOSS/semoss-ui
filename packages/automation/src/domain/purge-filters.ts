import { isRecord } from "@semoss/utility/object";

export const PURGE_COMPARATORS = [
	{ value: "==", label: "Equal to" },
	{ value: "!=", label: "Not equal to" },
	{ value: ">", label: "Greater than" },
	{ value: ">=", label: "Greater than or equal to" },
	{ value: "<", label: "Less than" },
	{ value: "<=", label: "Less than or equal to" },
] as const;

export type PurgeComparator = (typeof PURGE_COMPARATORS)[number]["value"];
export type PurgeValueType = "string" | "number" | "boolean" | "null";
type PurgeScalar = string | number | boolean | null;

/** One typed item in a multi-value comparison. */
export interface PurgeDraftValue {
	id: string;
	valueType: PurgeValueType;
	value: string;
}

/** Editable rule values retain incomplete numeric input until it is corrected. */
export interface PurgeFilterDraft {
	id: string;
	column: string;
	operator: PurgeComparator;
	valueType: PurgeValueType;
	value: string;
	values?: PurgeDraftValue[];
}

interface PurgeFilter {
	column: string;
	operator: PurgeComparator;
	value: PurgeScalar | PurgeScalar[];
}

function isPurgeScalar(value: unknown): value is PurgeScalar {
	return (
		value === null ||
		typeof value === "string" ||
		typeof value === "boolean" ||
		(typeof value === "number" && Number.isFinite(value))
	);
}

function isPurgeValue(
	value: unknown,
	operator: PurgeComparator,
): value is PurgeFilter["value"] {
	return Array.isArray(value)
		? (operator === "==" || operator === "!=") &&
				value.length > 0 &&
				value.length <= 100 &&
				value.every(isPurgeScalar)
		: isPurgeScalar(value) &&
				(value !== null || operator === "==" || operator === "!=");
}

/** Parses only filter shapes that the builder can round-trip without losing data. */
export function parsePurgeFilters(
	json: string,
):
	| { filters: PurgeFilter[]; error?: never }
	| { filters?: never; error: string } {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { error: "Enter a valid JSON array of filters." };
	}
	if (!Array.isArray(parsed) || parsed.length > 100) {
		return { error: "Enter an array containing at most 100 filters." };
	}
	const filters: PurgeFilter[] = [];
	for (const filter of parsed) {
		const comparator = isRecord(filter)
			? PURGE_COMPARATORS.find(
					(candidate) => candidate.value === filter.operator,
				)
			: undefined;
		if (
			!isRecord(filter) ||
			typeof filter.column !== "string" ||
			!comparator ||
			!("value" in filter) ||
			!isPurgeValue(filter.value, comparator.value) ||
			Object.keys(filter).some(
				(key) => !["column", "operator", "value"].includes(key),
			)
		) {
			return {
				error: "Each filter needs a column, comparator, and scalar value. Equal to and Not equal to also accept lists of 1 to 100 scalar values.",
			};
		}
		if (
			filter.value === null &&
			filter.operator !== "==" &&
			filter.operator !== "!="
		) {
			return { error: "Null values require Equal to or Not equal to." };
		}
		filters.push({
			column: filter.column,
			operator: comparator.value,
			value: filter.value,
		});
	}
	return { filters };
}

/** Converts validated JSON filters into editable rows with stable local identities. */
export function purgeFilterDrafts(json: string): PurgeFilterDraft[] {
	const parsed = parsePurgeFilters(json);
	return (parsed.filters ?? []).map((filter) => {
		const values = Array.isArray(filter.value)
			? filter.value.map(purgeDraftValue)
			: undefined;
		const nonNullValues =
			values?.filter((item) => item.valueType !== "null") ?? [];
		const sharedType = nonNullValues[0]?.valueType;
		return {
			...purgeDraftValue(Array.isArray(filter.value) ? "" : filter.value),
			...(sharedType &&
			nonNullValues.every((item) => item.valueType === sharedType)
				? { valueType: sharedType }
				: {}),
			id: crypto.randomUUID(),
			column: filter.column,
			operator: filter.operator,
			...(values ? { values } : {}),
		};
	});
}

/** Creates an editable scalar while preserving its JSON type. */
export function purgeDraftValue(value: PurgeScalar): PurgeDraftValue {
	return {
		id: crypto.randomUUID(),
		valueType:
			value === null
				? "null"
				: typeof value === "number"
					? "number"
					: typeof value === "boolean"
						? "boolean"
						: "string",
		value: value === null ? "" : String(value),
	};
}

/** Converts an editable scalar, keeping incomplete numeric input invalid. */
export function purgeDraftScalar(
	draft: Pick<PurgeDraftValue, "valueType" | "value">,
): PurgeScalar | undefined {
	if (draft.valueType === "null") return null;
	if (draft.valueType === "boolean")
		return draft.value === "true"
			? true
			: draft.value === "false"
				? false
				: undefined;
	if (draft.valueType === "number")
		return draft.value.trim() !== "" && Number.isFinite(Number(draft.value))
			? Number(draft.value)
			: undefined;
	return draft.value;
}

/** Infers manual input from column metadata without guessing numeric-looking text identifiers. */
export function inferPurgeDraftInput(
	value: string,
	columnType?: string,
	previousType: PurgeValueType = "string",
): Pick<PurgeDraftValue, "valueType" | "value"> {
	if (/^\$\{[^{}]+\}$/.test(value.trim()))
		return { valueType: "string", value };
	const type = columnType?.toUpperCase();
	const valueType: PurgeValueType =
		type &&
		[
			"INT",
			"INTEGER",
			"LONG",
			"BIGINT",
			"SMALLINT",
			"DOUBLE",
			"FLOAT",
			"DECIMAL",
			"NUMBER",
			"NUMERIC",
		].includes(type)
			? "number"
			: type === "BOOLEAN" || type === "BOOL"
				? "boolean"
				: type && type !== "UNKNOWN"
					? "string"
					: previousType === "null"
						? "string"
						: previousType;
	return {
		valueType,
		value: valueType === "boolean" ? value.toLowerCase() : value,
	};
}

/** Serializes builder rows while rejecting incomplete numbers instead of coercing them to null or zero. */
export function serializePurgeFilters(drafts: PurgeFilterDraft[]): {
	json: string;
	error: string;
} {
	const filters: PurgeFilter[] = [];
	for (const draft of drafts) {
		let value: PurgeFilter["value"];
		if (draft.values !== undefined) {
			const items: PurgeScalar[] = [];
			for (const item of draft.values) {
				const scalar = purgeDraftScalar(item);
				if (scalar === undefined)
					return {
						json: "",
						error: "Enter a valid number for each numeric value.",
					};
				items.push(scalar);
			}
			value = items;
		} else {
			const scalar = purgeDraftScalar(draft);
			if (scalar === undefined)
				return {
					json: "",
					error: "Enter a valid number for each numeric value.",
				};
			value = scalar;
		}
		if (!isPurgeValue(value, draft.operator))
			return {
				json: "",
				error: "Multiple values require Equal to or Not equal to and a list of 1 to 100 values. Null requires an equality comparison.",
			};
		filters.push({ column: draft.column, operator: draft.operator, value });
	}
	return { json: JSON.stringify(filters, null, 2), error: "" };
}

/** A typed suggestion observed in a bounded historical table sample. */
export interface PurgeValueSample {
	id: string;
	label: string;
	valueType: PurgeValueType;
	value: string;
}

/** Returns at most 25 distinct scalar suggestions without coercing text into numbers. */
export function getPurgeValueSamples(
	column: string,
	headers: string[],
	rows: unknown[][],
): PurgeValueSample[] {
	const index = headers.indexOf(column);
	if (index < 0) return [];
	const samples = new Map<string, PurgeValueSample>();
	for (const row of rows) {
		const value = row[index];
		if (
			value !== null &&
			typeof value !== "string" &&
			typeof value !== "number" &&
			typeof value !== "boolean"
		)
			continue;
		if (typeof value === "number" && !Number.isFinite(value)) continue;
		const valueType: PurgeValueType =
			value === null
				? "null"
				: typeof value === "number"
					? "number"
					: typeof value === "boolean"
						? "boolean"
						: "string";
		const id = JSON.stringify([valueType, value]);
		if (!samples.has(id))
			samples.set(id, {
				id,
				label:
					value === null
						? "(null)"
						: value === ""
							? "(empty text)"
							: String(value),
				valueType,
				value: value === null ? "" : String(value),
			});
		if (samples.size === 25) break;
	}
	return [...samples.values()];
}
