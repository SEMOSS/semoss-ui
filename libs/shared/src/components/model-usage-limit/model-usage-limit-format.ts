import type {
	ModelUsageCounts,
	ModelUsageLimit,
	ModelUsageLimitRule,
	ModelUsageMetric,
	ModelUsageWindow,
} from "@semoss/sdk";

/**
 * Where a usage limit is set, which decides whose use its rules can count:
 * a person's grant on a model (DIRECT), a team's grant (TEAM), a model's
 * public use (PUBLIC), a model's total (MODEL_TOTAL), a person's default for
 * all models (ALL_MODELS), the platform default (PLATFORM), or a team's total
 * across all models (TEAM_TOTAL)
 */
export type ModelUsageLimitSource =
	| "DIRECT"
	| "TEAM"
	| "PUBLIC"
	| "MODEL_TOTAL"
	| "ALL_MODELS"
	| "PLATFORM"
	| "TEAM_TOTAL";

/** The metrics, in the order the editor offers them */
export const MODEL_USAGE_METRICS: readonly ModelUsageMetric[] = [
	"TOKENS",
	"COST",
	"COMPUTE_TIME",
];

/** The windows, shortest first */
export const MODEL_USAGE_WINDOWS: readonly ModelUsageWindow[] = [
	"MINUTE",
	"HOUR",
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
];

/** Millionths of a dollar in a dollar */
const MICROS_PER_DOLLAR = 1_000_000;

/** What each window is called after an amount, with a length of 1 */
const WINDOW_PHRASES: Readonly<Record<ModelUsageWindow, string>> = {
	MINUTE: "a minute",
	HOUR: "an hour",
	DAY: "a day",
	WEEK: "a week",
	MONTH: "a month",
	YEAR: "a year",
};

/** What a window's units are called after "every", with a length above 1 */
const WINDOW_UNITS: Readonly<Record<ModelUsageWindow, string>> = {
	MINUTE: "minutes",
	HOUR: "hours",
	DAY: "days",
	WEEK: "weeks",
	MONTH: "months",
	YEAR: "years",
};

/**
 * The longest length each window can have: 59 minutes and 24 hours. A day and
 * the longer windows have no length.
 */
const MAX_WINDOW_LENGTHS: Readonly<Partial<Record<ModelUsageWindow, number>>> =
	{
		MINUTE: 59,
		HOUR: 24,
	};

/**
 * About how many minutes each window spans, to compare windows of different
 * lengths; a month counts as 30 days and a year as 365
 */
const WINDOW_MINUTES: Readonly<Record<ModelUsageWindow, number>> = {
	MINUTE: 1,
	HOUR: 60,
	DAY: 1_440,
	WEEK: 10_080,
	MONTH: 43_200,
	YEAR: 525_600,
};

/**
 * @param window - a rule's window
 * @returns the longest length it can have, such as 59 for minutes, or 1 for a
 * window that has no length
 */
export const getMaxWindowLength = (window: ModelUsageWindow): number =>
	MAX_WINDOW_LENGTHS[window] ?? 1;

/**
 * @param rule - a rule
 * @returns how many minutes or hours its window spans: 1 when it gives no
 * length
 */
const getWindowLength = (
	rule: Pick<ModelUsageLimitRule, "windowLength">,
): number => rule.windowLength ?? 1;

/**
 * @param rule - a rule
 * @returns about how many minutes its window spans, its length included, to
 * compare it with other windows
 */
export const getWindowMinutes = (
	rule: Pick<ModelUsageLimitRule, "window" | "windowLength">,
): number => WINDOW_MINUTES[rule.window] * getWindowLength(rule);

/**
 * @param window - a rule's window
 * @param length - how many minutes or hours it spans
 * @returns what it is called after an amount, such as "a day", "a minute" or
 * "every 10 minutes"
 */
const describeWindow = (window: ModelUsageWindow, length = 1): string =>
	length === 1
		? WINDOW_PHRASES[window]
		: `every ${length.toLocaleString()} ${WINDOW_UNITS[window]}`;

/**
 * @param rule - a rule
 * @returns the measure, window, length and counts, of which a limit has at
 * most one rule, as a key
 */
export const getRuleSlotKey = (
	rule: Pick<
		ModelUsageLimitRule,
		"metric" | "window" | "windowLength" | "counts"
	>,
): string =>
	`${rule.metric}:${rule.window}:${getWindowLength(rule)}:${rule.counts}`;

/**
 * @param source - where a limit is set
 * @returns which counts its rules can have: both for a team or public use,
 * only shared for a total, and only each person's own for the rest
 */
export const getSourceCounts = (
	source: ModelUsageLimitSource,
): readonly ModelUsageCounts[] => {
	if (source === "TEAM" || source === "PUBLIC") {
		return ["SHARED", "EACH_PERSON"];
	}
	return source === "MODEL_TOTAL" || source === "TEAM_TOTAL"
		? ["SHARED"]
		: ["EACH_PERSON"];
};

/**
 * @param source - where a limit is set
 * @returns whether it counts use across every model, so a cost rule leaves
 * models without known prices uncounted
 */
export const isAcrossAllModels = (source: ModelUsageLimitSource): boolean =>
	source === "ALL_MODELS" || source === "PLATFORM" || source === "TEAM_TOTAL";

/**
 * @param source - where a limit is set
 * @returns whether Unlimited means anything there: a total or the platform
 * default with no cap is the same as no limit defined
 */
export const isUnlimitedOffered = (source: ModelUsageLimitSource): boolean =>
	source !== "MODEL_TOTAL" &&
	source !== "TEAM_TOTAL" &&
	source !== "PLATFORM";

/**
 * @param micros - millionths of a US dollar
 * @returns the dollars, such as "$500" or "$1.92"
 */
export const formatDollars = (micros: number): string => {
	const dollars = micros / MICROS_PER_DOLLAR;
	return Number.isInteger(dollars)
		? `$${dollars.toLocaleString()}`
		: `$${dollars.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 6,
			})}`;
};

/**
 * @param milliseconds - compute time
 * @returns the time in the largest unit that reads well, such as "500 ms",
 * "30 seconds" or "2.5 hours"
 */
export const formatComputeTime = (milliseconds: number): string => {
	const units: [number, string, string][] = [
		[3_600_000, "hour", "hours"],
		[60_000, "minute", "minutes"],
		[1_000, "second", "seconds"],
	];
	for (const [size, one, many] of units) {
		if (milliseconds >= size) {
			const value = Math.round((milliseconds / size) * 10) / 10;
			return `${value.toLocaleString()} ${value === 1 ? one : many}`;
		}
	}
	return `${milliseconds.toLocaleString()} ms`;
};

/**
 * @param metric - what is counted
 * @param amount - tokens, millionths of a dollar or milliseconds
 * @returns the amount in words, such as "100,000 tokens", "$500" or
 * "2 hours of compute time"
 */
export const formatUsageAmount = (
	metric: ModelUsageMetric,
	amount: number,
): string => {
	if (metric === "COST") {
		return formatDollars(amount);
	}
	if (metric === "COMPUTE_TIME") {
		return `${formatComputeTime(amount)} of compute time`;
	}
	return `${amount.toLocaleString()} ${amount === 1 ? "token" : "tokens"}`;
};

/**
 * Reads dollars typed by a person, such as "1,500.25"
 *
 * @param text - what was typed
 * @returns millionths of a dollar, or null when it is not an amount; amounts
 * finer than a millionth are cut off
 */
export const parseDollarsToMicros = (text: string): number | null => {
	const cleaned = text.replace(/[$,\s]/g, "");
	const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
	if (!match || (match[1] === "" && !match[2])) {
		return null;
	}
	const whole = Number(match[1] || "0");
	const fraction = Number((match[2] ?? "").padEnd(6, "0").slice(0, 6));
	const micros = whole * MICROS_PER_DOLLAR + fraction;
	return Number.isSafeInteger(micros) ? micros : null;
};

/**
 * @param micros - millionths of a dollar
 * @returns the dollars as they are typed, without a sign or separators, such
 * as "1500.25"
 */
export const formatMicrosForInput = (micros: number): string => {
	const whole = Math.floor(micros / MICROS_PER_DOLLAR);
	const fraction = String(micros % MICROS_PER_DOLLAR)
		.padStart(6, "0")
		.replace(/0+$/, "");
	return fraction ? `${whole}.${fraction}` : String(whole);
};

/**
 * @param counts - whose use a rule counts
 * @param source - where its limit is set
 * @returns what is said after the rule, such as " shared" or " for each member"
 */
const describeCounts = (
	counts: ModelUsageCounts,
	source: ModelUsageLimitSource,
): string => {
	if (source !== "TEAM" && source !== "PUBLIC") {
		return "";
	}
	if (counts === "SHARED") {
		return " shared";
	}
	return source === "TEAM" ? " for each member" : " for each person";
};

/**
 * One rule in words, such as "100,000 tokens a minute for each member" or
 * "100,000 tokens every 10 minutes"
 *
 * @param rule - the rule
 * @param source - where its limit is set, which decides how counts are said
 * @returns the rule in words
 */
export const describeModelUsageRule = (
	rule: ModelUsageLimitRule,
	source: ModelUsageLimitSource = "DIRECT",
): string => {
	const counts = describeCounts(rule.counts, source);
	const window = describeWindow(rule.window, getWindowLength(rule));
	return rule.amount === null
		? `No amount ${window}${counts}`
		: `${formatUsageAmount(rule.metric, rule.amount)} ${window}${counts}`;
};

/**
 * A usage limit in one line, its rules joined by "and" since every one
 * applies, such as "100,000 tokens a minute for each member and $500 a month
 * shared"
 *
 * @param limit - the limit, or null for no limit defined
 * @param source - where it is set, which decides how counts are said
 * @returns the limit in words: "No Limit Defined", "Unlimited" or its rules
 */
export const describeModelUsageLimit = (
	limit: ModelUsageLimit | null | undefined,
	source: ModelUsageLimitSource = "DIRECT",
): string => {
	if (!limit) {
		return "No Limit Defined";
	}
	if (limit.unlimited) {
		return "Unlimited";
	}
	if (limit.rules.length === 0) {
		return "No Limit Defined";
	}
	return limit.rules
		.map((rule) => describeModelUsageRule(rule, source))
		.join(" and ");
};

/**
 * @param rule - a rule
 * @returns a key that is the same for two rules that allow the same thing
 */
const getRuleKey = (rule: ModelUsageLimitRule): string =>
	[
		rule.metric,
		rule.window,
		getWindowLength(rule),
		rule.counts,
		rule.amount ?? "",
	].join(":");

/**
 * Whether two limits allow the same thing, whatever the order of their rules.
 * Null, and a limit that is neither Unlimited nor has a rule, are both no limit
 * defined.
 *
 * @param a - one limit
 * @param b - the other
 * @returns whether they match
 */
export const isSameModelUsageLimit = (
	a: ModelUsageLimit | null | undefined,
	b: ModelUsageLimit | null | undefined,
): boolean => {
	const isNoneA = !a || (!a.unlimited && a.rules.length === 0);
	const isNoneB = !b || (!b.unlimited && b.rules.length === 0);
	if (isNoneA || isNoneB) {
		return isNoneA && isNoneB;
	}
	if (a.unlimited || b.unlimited) {
		return a.unlimited === b.unlimited;
	}
	const keysA = a.rules.map(getRuleKey).sort();
	const keysB = b.rules.map(getRuleKey).sort();
	return (
		keysA.length === keysB.length &&
		keysA.every((key, index) => key === keysB[index])
	);
};

/**
 * The limit to send to an endpoint that keeps the current limit when none is
 * sent. A limit with no rules that is not Unlimited says no limit defined, so
 * the endpoint clears it.
 *
 * @param limit - the limit, or null for no limit defined
 * @returns the limit to send
 */
export const toExplicitUsageLimit = (
	limit: ModelUsageLimit | null,
): ModelUsageLimit => limit ?? { unlimited: false, rules: [] };

/**
 * @param limit - a limit
 * @returns whether it has a cost rule
 */
export const hasCostRule = (limit: ModelUsageLimit | null): boolean =>
	limit?.rules.some((rule) => rule.metric === "COST") ?? false;

/** How full a rule must be, from 0 to 1, to count as almost reached */
const ALMOST_REACHED_SHARE = 0.9;

/** How close a rule is to its amount, once that is worth saying */
export type UsageShareStatus = "USED_UP" | "ALMOST_REACHED";

/** What each status of a rule's use is called */
export const USAGE_SHARE_STATUS_LABELS: Readonly<
	Record<UsageShareStatus, string>
> = {
	USED_UP: "Used Up",
	ALMOST_REACHED: "Almost Reached",
};

/**
 * @param share - how much of a rule is used, from 0 to 1
 * @returns USED_UP at its amount, ALMOST_REACHED from `ALMOST_REACHED_SHARE`,
 * and null before that, when a rule has plenty left
 */
export const getUsageShareStatus = (share: number): UsageShareStatus | null =>
	share >= 1
		? "USED_UP"
		: share >= ALMOST_REACHED_SHARE
			? "ALMOST_REACHED"
			: null;

/**
 * @param share - how much of a rule is used, from 0 to 1
 * @returns the whole percent used. A rule not used up is rounded down, so it
 * never reads 100; the small allowance keeps 0.29 at 29, where floating point
 * makes it 28.999...
 */
export const getUsedPercent = (share: number): number =>
	share >= 1
		? 100
		: Math.max(0, Math.min(99, Math.floor(share * 100 + 1e-9)));
