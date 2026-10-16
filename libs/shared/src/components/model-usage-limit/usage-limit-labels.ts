import type {
	UsageBilledLimitType,
	UsageBilledTo,
	UsageLimitPathStep,
	UsageLimitStepState,
	UsageLimitType,
	UsageNextTeam,
} from "@semoss/sdk";
import type { ModelUsageLimitSource } from "./model-usage-limit-format";

/**
 * Why a usage limit is shown read-only to anyone but a model's owners, and
 * admins in admin mode: only they set or change a person's limit, a team's,
 * the public use limit and the model total
 */
export const OWNERS_ONLY_LIMIT_REASON = "Only owners can set usage limits";

/**
 * Why only a model's owners, and admins in admin mode, take away or shorten
 * the access of someone with a usage limit on it: the limit goes with their
 * access, so they would fall through to another limit
 */
export const OWNERS_END_LIMITED_ACCESS_REASON =
	"Only owners can end or shorten the access of someone with a usage limit";

/** What each source and ceiling is called */
const LIMIT_TYPE_LABELS: Readonly<Record<UsageLimitType, string>> = {
	MODEL_TOTAL: "Model Total",
	DIRECT: "Direct Limit",
	TEAM: "Team Limit",
	PUBLIC: "Public Use Limit",
	ALL_MODELS: "User's Total Model Limit",
	PLATFORM: "General Platform Limit",
};

/** What each state is called on a step */
const STATE_LABELS: Readonly<Record<UsageLimitStepState, string>> = {
	DEFINED: "Defined",
	NOT_DEFINED: "No Limit Defined",
	SKIPPED: "Skipped",
	NOT_REACHED: "Not Reached",
	CHECKED: "Within Limit",
	BILLED: "Applied Here",
	NEXT: "Next Team",
	REACHED: "Reached",
};

/** Why a step is skipped, in words */
const REASON_LABELS: Readonly<Record<string, string>> = {
	NOT_PUBLIC: "This model is not public",
	NO_GRANT: "No access given on this model",
};

/**
 * @param limitType - a source or ceiling
 * @param id - the team's name, for a team
 * @returns what it is called, such as "Public Use Limit" or "Ops Team Limit"
 */
export const getUsageSourceLabel = (
	limitType: UsageLimitType | UsageBilledLimitType,
	id?: string | null,
): string =>
	limitType === "TEAM" && id
		? `${id} ${LIMIT_TYPE_LABELS.TEAM}`
		: LIMIT_TYPE_LABELS[limitType];

/**
 * @param state - where a call stands at a step
 * @returns what the step's badge says, such as "Applied Here"
 */
export const getUsageStepStateLabel = (state: UsageLimitStepState): string =>
	STATE_LABELS[state];

/**
 * @param reason - why a step is skipped, such as NOT_PUBLIC
 * @returns the reason in words
 */
export const getUsageStepReasonLabel = (reason: string): string =>
	REASON_LABELS[reason] ?? reason;

/**
 * @param step - a step of how limits apply
 * @returns where its limit is set, which decides how its rules are said
 */
export const getUsageStepSource = (
	step: Pick<UsageLimitPathStep, "limitType">,
): ModelUsageLimitSource => step.limitType;

/**
 * Which limit applies to a person's calls, in a few words, such as "Direct
 * Limit", "Ops Team Limit, then Data" or "No Limit"
 *
 * @param billedTo - the source billed, or null when no limit applies
 * @param nextTeams - for a team, the teams calls move on to, in billing order
 * @returns the words
 */
export const describeBilledTo = (
	billedTo: UsageBilledTo | null,
	nextTeams: readonly UsageNextTeam[] = [],
): string => {
	if (!billedTo) {
		return "No Limit";
	}
	const label = getUsageSourceLabel(billedTo.limitType, billedTo.id);
	if (billedTo.limitType !== "TEAM" || nextTeams.length === 0) {
		return label;
	}
	return [label, ...nextTeams.map((team) => team.id)].join(", then ");
};
