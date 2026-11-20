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
export type PurgeValueType = "string" | "number" | "boolean";
type PurgeScalar = string | number | boolean;
const FRAME_COLUMN_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Editable rule values retain incomplete numeric input until it is corrected. */
export interface PurgeFilterDraft {
	id: string;
	column: string;
	operator: PurgeComparator;
	valueType: PurgeValueType;
	value: string;
}

interface PurgeFilter {
	column: string;
	operator: PurgeComparator;
	value: PurgeScalar;
}

function isPurgeScalar(value: unknown): value is PurgeScalar {
	return (
		typeof value === "string" ||
		typeof value === "boolean" ||
		(typeof value === "number" && Number.isFinite(value))
	);
}

/** Parses only scalar filter shapes supported by the Automation Clean contract. */
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
			!FRAME_COLUMN_IDENTIFIER.test(filter.column) ||
			!comparator ||
			!("value" in filter) ||
			!isPurgeScalar(filter.value) ||
			Object.keys(filter).some(
				(key) => !["column", "operator", "value"].includes(key),
			)
		) {
			return {
				error: "Each filter needs a column, comparator, and scalar text, number, or boolean value.",
			};
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
	return (parsed.filters ?? []).map((filter) => ({
		id: crypto.randomUUID(),
		column: filter.column,
		operator: filter.operator,
		...purgeDraftValue(filter.value),
	}));
}

/** Creates an editable scalar while preserving its JSON type. */
export function purgeDraftValue(
	value: PurgeScalar,
): Pick<PurgeFilterDraft, "valueType" | "value"> {
	return {
		valueType:
			typeof value === "number"
				? "number"
				: typeof value === "boolean"
					? "boolean"
					: "string",
		value: String(value),
	};
}

/** Converts an editable scalar, keeping incomplete numeric input invalid. */
export function purgeDraftScalar(
	draft: Pick<PurgeFilterDraft, "valueType" | "value">,
): PurgeScalar | undefined {
	if (draft.valueType === "boolean") {
		return draft.value === "true"
			? true
			: draft.value === "false"
				? false
				: undefined;
	}
	if (draft.valueType === "number") {
		return draft.value.trim() !== "" && Number.isFinite(Number(draft.value))
			? Number(draft.value)
			: undefined;
	}
	return draft.value;
}

/** Infers manual input from column metadata without guessing numeric-looking text identifiers. */
export function inferPurgeDraftInput(
	value: string,
	columnType?: string,
	previousType: PurgeValueType = "string",
): Pick<PurgeFilterDraft, "valueType" | "value"> {
	if (/^\$\{[^{}]+\}$/.test(value.trim())) {
		return { valueType: "string", value };
	}
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
					: previousType;
	return {
		valueType,
		value: valueType === "boolean" ? value.toLowerCase() : value,
	};
}

/** Serializes builder rows while rejecting incomplete typed values. */
export function serializePurgeFilters(drafts: PurgeFilterDraft[]): {
	json: string;
	error: string;
} {
	const filters: PurgeFilter[] = [];
	for (const draft of drafts) {
		const value = purgeDraftScalar(draft);
		if (value === undefined) {
			return {
				json: "",
				error: "Enter a valid value for each filter.",
			};
		}
		filters.push({
			column: draft.column,
			operator: draft.operator,
			value,
		});
	}
	return { json: JSON.stringify(filters, null, 2), error: "" };
}
