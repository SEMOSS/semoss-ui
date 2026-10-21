import type { ModelUsageLimit, ModelUsageLimitRule } from "@semoss/sdk";
import {
	describeModelUsageRule,
	getMaxWindowLength,
	getRuleSlotKey,
	getSourceCounts,
	getWindowMinutes,
	isAcrossAllModels,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";

/** What the checks need to know about where a limit is set */
export interface ModelUsageLimitCheckOptions {
	/** Where the limit is set */
	source: ModelUsageLimitSource;
	/**
	 * Whether the model has known prices; a limit across all models can always
	 * have cost rules
	 */
	isCostAvailable: boolean;
}

/** What is wrong with one rule, and what may not work as meant */
export interface ModelUsageRuleCheck {
	/** Why the rule cannot be saved, or null */
	problem: string | null;
	/** Why the rule may never be reached, or null; it can still be saved */
	warning: string | null;
}

/** What each window's length is counted in, for the problems */
const LENGTH_UNITS: Readonly<Record<"MINUTE" | "HOUR", string>> = {
	MINUTE: "minutes",
	HOUR: "hours",
};

/**
 * Why a rule's window length cannot be saved: a minute window spans 1 to 59
 * minutes, an hour window 1 to 24 hours, and the longer windows have no length
 *
 * @param rule - a rule
 * @returns the problem, or null
 */
export const findWindowLengthProblem = (
	rule: Pick<ModelUsageLimitRule, "window" | "windowLength">,
): string | null => {
	const length = rule.windowLength;
	if (length === undefined || length === 1) {
		return null;
	}
	if (rule.window !== "MINUTE" && rule.window !== "HOUR") {
		return "Only minute and hour rules can have a length";
	}
	const max = getMaxWindowLength(rule.window);
	return Number.isInteger(length) && length >= 1 && length <= max
		? null
		: `Enter a length from 1 to ${max} ${LENGTH_UNITS[rule.window]}`;
};

/**
 * @param rule - a rule
 * @param rules - every rule of its limit
 * @param index - its index
 * @param options - where the limit is set
 * @returns why the rule cannot be saved, or null
 */
const findRuleProblem = (
	rule: ModelUsageLimitRule,
	rules: readonly ModelUsageLimitRule[],
	index: number,
	options: ModelUsageLimitCheckOptions,
): string | null => {
	const { source, isCostAvailable } = options;
	if (!getSourceCounts(source).includes(rule.counts)) {
		return rule.counts === "SHARED"
			? "This limit counts only each person's own use"
			: "This limit has shared rules only";
	}
	if (
		rule.metric === "COST" &&
		!isCostAvailable &&
		!isAcrossAllModels(source)
	) {
		return "This model has no known prices";
	}
	if (rule.amount === null || rule.amount < 1) {
		return "Enter an amount above 0";
	}
	const lengthProblem = findWindowLengthProblem(rule);
	if (lengthProblem) {
		return lengthProblem;
	}
	// rules over windows of different lengths, such as a minute and every 10
	// minutes, count different things
	const slot = getRuleSlotKey(rule);
	const isRepeated = rules
		.slice(0, index)
		.some((other) => getRuleSlotKey(other) === slot);
	return isRepeated
		? "Another rule already counts this measure over this window"
		: null;
};

/**
 * @param rule - a rule
 * @param rules - every rule of its limit
 * @param source - where the limit is set
 * @returns why the rule can never be reached, or null
 */
const findRuleWarning = (
	rule: ModelUsageLimitRule,
	rules: readonly ModelUsageLimitRule[],
	source: ModelUsageLimitSource,
): string | null => {
	const { amount } = rule;
	if (amount === null || findWindowLengthProblem(rule) !== null) {
		return null;
	}
	// windows are compared by how long they span, so every 30 minutes is
	// shorter than an hour, and every 24 hours is as long as a day
	const minutes = getWindowMinutes(rule);
	// a longer window, or a shared total, that allows less leaves this rule
	// nothing to stop
	const tighter = rules.find((other) => {
		if (
			other === rule ||
			other.metric !== rule.metric ||
			findWindowLengthProblem(other) !== null
		) {
			return false;
		}
		if (other.amount === null || other.amount >= amount) {
			return false;
		}
		const otherMinutes = getWindowMinutes(other);
		if (other.counts === rule.counts) {
			return otherMinutes > minutes;
		}
		return (
			rule.counts === "EACH_PERSON" &&
			other.counts === "SHARED" &&
			otherMinutes >= minutes
		);
	});
	return tighter
		? `${describeModelUsageRule(rule, source)} can never be reached, since ${describeModelUsageRule(tighter, source)} is less`
		: null;
};

/**
 * Checks each rule of a limit
 *
 * @param limit - the limit
 * @param options - where it is set
 * @returns one check per rule, in the limit's order
 */
export const checkModelUsageLimitRules = (
	limit: ModelUsageLimit | null,
	options: ModelUsageLimitCheckOptions,
): ModelUsageRuleCheck[] =>
	(limit?.rules ?? []).map((rule, index, rules) => ({
		problem: findRuleProblem(rule, rules, index, options),
		warning: findRuleWarning(rule, rules, options.source),
	}));

/**
 * Why a limit from the editor cannot be saved, such as a rule with no amount
 *
 * @param limit - the limit, or null for no limit defined
 * @param options - where it is set
 * @returns the first problem, or null when it can be saved
 */
export const findModelUsageLimitProblem = (
	limit: ModelUsageLimit | null,
	options: ModelUsageLimitCheckOptions,
): string | null => {
	if (!limit || limit.unlimited) {
		return null;
	}
	if (limit.rules.length === 0) {
		return "Add a rule, or choose No Limit Defined";
	}
	return (
		checkModelUsageLimitRules(limit, options).find(
			(check) => check.problem !== null,
		)?.problem ?? null
	);
};
