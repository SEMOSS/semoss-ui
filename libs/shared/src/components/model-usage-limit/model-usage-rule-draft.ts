import type {
	ModelUsageCounts,
	ModelUsageLimit,
	ModelUsageLimitRule,
	ModelUsageMetric,
	ModelUsageWindow,
} from "@semoss/sdk";
import {
	formatMicrosForInput,
	getMaxWindowLength,
	getSourceCounts,
	type ModelUsageLimitSource,
	parseDollarsToMicros,
} from "./model-usage-limit-format";

/** One rule as the editor holds it while it is typed */
export interface ModelUsageRuleDraft {
	/** Stable key for the row */
	id: string;
	/** What it counts */
	metric: ModelUsageMetric;
	/** How long its count runs */
	window: ModelUsageWindow;
	/**
	 * How many minutes or hours the window spans, as typed; used only on a
	 * minute or hour window
	 */
	lengthText: string;
	/** Whose use it counts */
	counts: ModelUsageCounts;
	/** The amount as typed: tokens, dollars or milliseconds */
	amountText: string;
}

/** Which of the three the editor shows */
export type ModelUsageLimitMode = "NOT_DEFINED" | "UNLIMITED" | "RULES";

/** The windows a new rule tries first, so a second rule starts on a new one */
const NEW_RULE_WINDOWS: readonly ModelUsageWindow[] = [
	"DAY",
	"MONTH",
	"MINUTE",
	"HOUR",
	"WEEK",
	"YEAR",
];

let nextDraftId = 0;

/** @returns a key no other row has */
const makeDraftId = (): string => {
	nextDraftId += 1;
	return `rule-${nextDraftId}`;
};

/**
 * @param text - digits typed, with or without separators
 * @returns the whole number, or null
 */
const parseWholeNumber = (text: string): number | null => {
	const digits = text.replace(/[^0-9]/g, "");
	if (!digits) {
		return null;
	}
	const value = Number(digits);
	return Number.isSafeInteger(value) ? value : null;
};

/**
 * @param window - a rule's window
 * @returns whether it can span more than one minute or hour, such as every 10
 * minutes
 */
export const hasWindowLength = (window: ModelUsageWindow): boolean =>
	getMaxWindowLength(window) > 1;

/**
 * @param text - the window length as typed
 * @returns the text the input keeps: at most two digits
 */
export const cleanLengthInput = (text: string): string =>
	text.replace(/[^0-9]/g, "").slice(0, 2);

/**
 * A window length put in its window's range when the input is left: 1 when
 * nothing is typed, and at most 59 minutes or 24 hours
 *
 * @param window - the rule's window
 * @param text - the window length as typed
 * @returns the length as the input shows it
 */
export const clampLengthInput = (
	window: ModelUsageWindow,
	text: string,
): string => {
	const length = parseWholeNumber(text) ?? 1;
	return String(Math.min(Math.max(length, 1), getMaxWindowLength(window)));
};

/**
 * @param draft - a rule as the editor holds it
 * @returns its window length to send: left out for 1 and on a window with no
 * length, and 0 while nothing is typed, which the checks refuse
 */
const getDraftWindowLength = (
	draft: ModelUsageRuleDraft,
): number | undefined => {
	if (!hasWindowLength(draft.window)) {
		return undefined;
	}
	const length = parseWholeNumber(draft.lengthText) ?? 0;
	return length === 1 ? undefined : length;
};

/**
 * Formats a whole amount for an input with ASCII digits and comma separators,
 * whatever the browser's locale, so `parseWholeNumber` reads it back: locales
 * such as ar-EG and fa-IR write other digits.
 * @param value - a whole amount
 * @returns the amount as the input shows it, such as "100,000"
 */
const formatWholeNumberForInput = (value: number): string =>
	value.toLocaleString("en-US");

/**
 * @param metric - what a rule counts
 * @param amount - its amount
 * @returns the amount as the input shows it
 */
const formatAmountForInput = (
	metric: ModelUsageMetric,
	amount: number | null,
): string => {
	if (amount === null) {
		return "";
	}
	return metric === "COST"
		? formatMicrosForInput(amount)
		: formatWholeNumberForInput(amount);
};

/**
 * @param metric - what a rule counts
 * @param text - the amount as typed
 * @returns the text the input keeps: digits with separators, or dollars with
 * at most six decimals
 */
export const cleanAmountInput = (
	metric: ModelUsageMetric,
	text: string,
): string => {
	if (metric !== "COST") {
		const value = parseWholeNumber(text);
		return value === null ? "" : formatWholeNumberForInput(value);
	}
	const cleaned = text.replace(/[^0-9.]/g, "");
	const [whole, ...rest] = cleaned.split(".");
	return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 6)}` : whole;
};

/**
 * @param rule - a rule of the limit the editor starts from
 * @returns the rule as the editor holds it
 */
export const toRuleDraft = (
	rule: ModelUsageLimitRule,
): ModelUsageRuleDraft => ({
	id: makeDraftId(),
	metric: rule.metric,
	window: rule.window,
	lengthText: String(rule.windowLength ?? 1),
	counts: rule.counts,
	amountText: formatAmountForInput(rule.metric, rule.amount),
});

/**
 * @param draft - a rule as the editor holds it
 * @returns the rule; an amount not typed yet is null, and a window length is
 * sent only when it is more than 1
 */
export const fromRuleDraft = (
	draft: ModelUsageRuleDraft,
): ModelUsageLimitRule => {
	const windowLength = getDraftWindowLength(draft);
	return {
		metric: draft.metric,
		amount:
			draft.metric === "COST"
				? parseDollarsToMicros(draft.amountText)
				: parseWholeNumber(draft.amountText),
		window: draft.window,
		...(windowLength !== undefined ? { windowLength } : {}),
		counts: draft.counts,
	};
};

/**
 * @param mode - which of the three the editor shows
 * @param drafts - its rules
 * @returns the limit: null for no limit defined
 */
export const toModelUsageLimit = (
	mode: ModelUsageLimitMode,
	drafts: readonly ModelUsageRuleDraft[],
): ModelUsageLimit | null => {
	if (mode === "NOT_DEFINED") {
		return null;
	}
	if (mode === "UNLIMITED") {
		return { unlimited: true, rules: [] };
	}
	return { unlimited: false, rules: drafts.map(fromRuleDraft) };
};

/**
 * A rule to add: tokens, on a window the limit does not count yet, shared for
 * a limit's first rule where it can be shared and for each person after that
 *
 * @param drafts - the rules so far
 * @param source - where the limit is set
 * @returns the new rule
 */
export const makeNewRuleDraft = (
	drafts: readonly ModelUsageRuleDraft[],
	source: ModelUsageLimitSource,
): ModelUsageRuleDraft => {
	const allowed = getSourceCounts(source);
	const counts: ModelUsageCounts =
		allowed.length === 1
			? allowed[0]
			: drafts.length === 0
				? "SHARED"
				: "EACH_PERSON";
	// the new rule spans one of its window, so only rules of length 1 count
	const window =
		NEW_RULE_WINDOWS.find(
			(candidate) =>
				!drafts.some(
					(draft) =>
						draft.metric === "TOKENS" &&
						draft.counts === counts &&
						draft.window === candidate &&
						getDraftWindowLength(draft) === undefined,
				),
		) ?? "DAY";
	return {
		id: makeDraftId(),
		metric: "TOKENS",
		window,
		lengthText: "1",
		counts,
		amountText: "",
	};
};
