import type { ModelUsageCounts, ModelUsageWindow } from "./access";

/** Metrics supported by the shared engine limit protocol; each catalog advertises its subset. */
export type EngineUsageMetric =
	| "TOKENS"
	| "COST"
	| "COMPUTE_TIME"
	| "QUERIES"
	| "ROWS";

/** A cumulative usage rule. Null amounts exist only in an editor draft. */
export interface EngineUsageLimitRule<
	M extends EngineUsageMetric = EngineUsageMetric,
> {
	metric: M;
	amount: number | null;
	window: ModelUsageWindow;
	windowLength?: number;
	counts: ModelUsageCounts;
}

/** Undefined is represented by null, distinct from explicit Unlimited. */
export interface EngineUsageLimit<
	M extends EngineUsageMetric = EngineUsageMetric,
> {
	unlimited: boolean;
	rules: EngineUsageLimitRule<M>[];
}

/** The engine's supported metrics and its non-grant limits. */
export interface EngineUsageSettings {
	catalogType: string;
	metrics: EngineUsageMetric[];
	publicUse: { isPublic: boolean; usageLimit: EngineUsageLimit | null };
	engineTotal: { usageLimit: EngineUsageLimit | null };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const METRICS: readonly EngineUsageMetric[] = [
	"TOKENS",
	"COST",
	"COMPUTE_TIME",
	"QUERIES",
	"ROWS",
];
const WINDOWS: readonly ModelUsageWindow[] = [
	"MINUTE",
	"HOUR",
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
];

/** Validates the catalog-independent wire limit without reinterpreting model payloads. */
export const readEngineUsageLimit = (
	input: unknown,
): EngineUsageLimit | null => {
	const value: unknown =
		typeof input === "string" && input.trim() ? JSON.parse(input) : input;
	if (value === undefined || value === null || value === "") return null;
	if (
		!isRecord(value) ||
		typeof value.unlimited !== "boolean" ||
		!Array.isArray(value.rules)
	)
		throw new Error("Invalid engine usage limit");
	const rules = value.rules.map((entry): EngineUsageLimitRule => {
		if (!isRecord(entry)) throw new Error("Invalid engine usage rule");
		const metric = METRICS.find((item) => item === entry.metric);
		const window = WINDOWS.find((item) => item === entry.window);
		const counts =
			entry.counts === "SHARED"
				? "SHARED"
				: entry.counts === "EACH_PERSON"
					? "EACH_PERSON"
					: null;
		if (
			!metric ||
			!window ||
			!counts ||
			typeof entry.amount !== "number" ||
			!Number.isSafeInteger(entry.amount) ||
			entry.amount <= 0
		)
			throw new Error("Invalid engine usage rule");
		const length = entry.windowLength;
		if (
			length !== undefined &&
			length !== null &&
			(typeof length !== "number" ||
				!Number.isInteger(length) ||
				length < 1 ||
				length >
					(window === "MINUTE" ? 59 : window === "HOUR" ? 24 : 1))
		)
			throw new Error("Invalid engine usage window length");
		return {
			metric,
			window,
			counts,
			amount: entry.amount,
			...(typeof length === "number" && length > 1
				? { windowLength: length }
				: {}),
		};
	});
	if (value.unlimited && rules.length > 0)
		throw new Error("Unlimited has no rules");
	return !value.unlimited && rules.length === 0
		? null
		: { unlimited: value.unlimited, rules };
};

/** Reads capability metadata only when the server supplies the new engine contract. */
export const readEngineUsageSettings = (
	value: unknown,
): EngineUsageSettings | undefined => {
	if (value === undefined || value === null) return undefined;
	if (
		!isRecord(value) ||
		typeof value.catalogType !== "string" ||
		!Array.isArray(value.metrics) ||
		!isRecord(value.publicUse) ||
		!isRecord(value.engineTotal)
	)
		throw new Error("Invalid engine usage settings");
	const metrics = value.metrics.map((entry) => {
		const metric = METRICS.find((item) => item === entry);
		if (!metric) throw new Error("Unsupported engine usage metric");
		return metric;
	});
	if (metrics.length === 0) throw new Error("Missing engine usage metrics");
	return {
		catalogType: value.catalogType,
		metrics,
		publicUse: {
			isPublic: value.publicUse.isPublic === true,
			usageLimit: readEngineUsageLimit(value.publicUse.usageLimit),
		},
		engineTotal: {
			usageLimit: readEngineUsageLimit(value.engineTotal.usageLimit),
		},
	};
};
