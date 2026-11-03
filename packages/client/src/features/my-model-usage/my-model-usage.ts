import type {
	MyModelUsagePath,
	UsageLimitPathStep,
	UsageLimitRuleUsage,
} from "@semoss/sdk";
import {
	getUsageShareStatus,
	getUsageSourceLabel,
	type ModelUsageLimitSource,
	USAGE_SHARE_STATUS_LABELS,
} from "@semoss/shared";

/** Where the person stands on a model, the most urgent first */
export type ModelUsageStanding =
	| "USED_UP"
	| "ALMOST_REACHED"
	| "WITHIN_LIMIT"
	| "NOT_KNOWN"
	| "UNLIMITED"
	| "NO_LIMIT";

/** What each standing is called */
export const STANDING_LABELS: Readonly<Record<ModelUsageStanding, string>> = {
	USED_UP: USAGE_SHARE_STATUS_LABELS.USED_UP,
	ALMOST_REACHED: USAGE_SHARE_STATUS_LABELS.ALMOST_REACHED,
	WITHIN_LIMIT: "Within Limit",
	NOT_KNOWN: "Use Not Known",
	UNLIMITED: "Unlimited",
	NO_LIMIT: "No Limit",
};

/** The standings in order, the most urgent first */
const STANDING_ORDER: readonly ModelUsageStanding[] = [
	"USED_UP",
	"ALMOST_REACHED",
	"WITHIN_LIMIT",
	"NOT_KNOWN",
	"UNLIMITED",
	"NO_LIMIT",
];

/** The rule with the most of it used, and where it is set */
export interface TightestRule {
	/** The rule, with what is used */
	rule: UsageLimitRuleUsage;
	/** The step it belongs to: a ceiling or the limit applied */
	step: UsageLimitPathStep;
	/** Where it is set, which decides how its counts are said */
	source: ModelUsageLimitSource;
	/** How much of it is used, from 0 to 1 */
	share: number;
}

/** One model on the dashboard */
export interface ModelUsageSummary {
	/** The model */
	engineId: string;
	/** Its name */
	name: string;
	/** The limit the person's calls stop at, or null when none applies */
	applied: UsageLimitPathStep | null;
	/** The rule with the most of it used, across the limit applied and the ceilings, or null */
	tightest: TightestRule | null;
	/** Where the person stands */
	standing: ModelUsageStanding;
}

/**
 * @param rules - a step's rules, with what is used
 * @param step - the step
 * @param source - where its rules are set
 * @returns each rule whose use is known, with how much of it is used
 */
const toShares = (
	rules: readonly UsageLimitRuleUsage[],
	step: UsageLimitPathStep,
	source: ModelUsageLimitSource,
): TightestRule[] =>
	rules.flatMap((rule) =>
		rule.used !== null && rule.amount !== null && rule.amount > 0
			? [
					{
						rule,
						step,
						source,
						share: Math.min(1, rule.used / rule.amount),
					},
				]
			: [],
	);

/**
 * Where the person stands on one model: the limit applied, its most used rule
 * or a ceiling's, and whether calls are refused, almost, or not.
 *
 * @param model - a model with how usage limits apply to the person on it
 * @returns its summary
 */
export const summarizeModelUsage = (
	model: MyModelUsagePath,
): ModelUsageSummary => {
	const { path } = model;
	// a step that refuses calls is the one they stop at, so it is the limit applied
	const applied =
		path.steps.find((step) => step.state === "BILLED") ??
		path.steps.find((step) => step.state === "REACHED") ??
		null;
	const ceilings = path.ceilings.filter((step) => step.state !== "SKIPPED");
	const shares = [
		...ceilings.flatMap((step) =>
			toShares(step.rules, step, step.limitType),
		),
		...(applied ? toShares(applied.rules, applied, applied.limitType) : []),
		...(applied?.teamTotal
			? toShares(applied.teamTotal.rules, applied, "TEAM_TOTAL")
			: []),
	];
	const tightest = shares.reduce<TightestRule | null>(
		(most, next) =>
			most === null || next.share > most.share ? next : most,
		null,
	);
	const isRefused = [...path.ceilings, ...path.steps].some(
		(step) => step.state === "REACHED",
	);
	const hasRules =
		ceilings.some((step) => step.rules.length > 0) ||
		(applied !== null && !applied.unlimited && applied.rules.length > 0);
	const shareStatus =
		tightest === null ? null : getUsageShareStatus(tightest.share);
	const standing: ModelUsageStanding = isRefused
		? "USED_UP"
		: (shareStatus ??
			(tightest !== null
				? "WITHIN_LIMIT"
				: hasRules
					? "NOT_KNOWN"
					: applied?.unlimited
						? "UNLIMITED"
						: "NO_LIMIT"));
	return {
		engineId: model.engineId,
		name: model.name,
		applied,
		tightest,
		standing,
	};
};

/**
 * @param tightest - the most used rule of a model
 * @param resetsAt - when its window starts again, in words, or empty
 * @returns the line under its bar: the ceiling it belongs to, such as "Model
 * Total" or "Team Total", and when it resets, such as "Team Total, resets Oct
 * 13 at 12:00 AM"; a rule of the limit applied names no source
 */
export const describeTightestDetail = (
	tightest: TightestRule,
	resetsAt: string,
): string => {
	const sourceName =
		tightest.source === "TEAM_TOTAL"
			? "Team Total"
			: tightest.step.layer === "CEILING"
				? getUsageSourceLabel(tightest.step.limitType, tightest.step.id)
				: "";
	return [sourceName, resetsAt ? `resets ${resetsAt}` : ""]
		.filter(Boolean)
		.join(", ");
};

/**
 * @param models - the models with how usage limits apply on each
 * @returns their summaries, the most urgent first, then the most used, then by name
 */
export const summarizeMyModelUsage = (
	models: readonly MyModelUsagePath[],
): ModelUsageSummary[] =>
	models
		.map(summarizeModelUsage)
		.sort(
			(a, b) =>
				STANDING_ORDER.indexOf(a.standing) -
					STANDING_ORDER.indexOf(b.standing) ||
				(b.tightest?.share ?? 0) - (a.tightest?.share ?? 0) ||
				a.name.localeCompare(b.name),
		);
