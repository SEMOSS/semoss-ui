import type {
	EffectivePermissionRow,
	EffectiveUsage,
	ModelUsageLimit,
	UsageBilledLimitType,
	UsageNotApplied,
} from "@semoss/sdk";
import {
	getUsageSourceLabel,
	type ModelUsageLimitSource,
} from "@semoss/shared";

/** Which people the Limit Applied By filter shows: anyone, those one type of limit applies to, or those with no limit */
export type BilledToFilter = "ALL" | UsageBilledLimitType | "NONE";

/** The Limit Applied By filter's choices */
export const BILLED_TO_FILTERS: readonly {
	value: BilledToFilter;
	label: string;
}[] = [
	{ value: "ALL", label: "Any" },
	{ value: "DIRECT", label: "Direct Limit" },
	{ value: "TEAM", label: "Team Limit" },
	{ value: "PUBLIC", label: "Public Use Limit" },
	{ value: "ALL_MODELS", label: "User's Total Model Limit" },
	{ value: "PLATFORM", label: "General Platform Limit" },
	{ value: "NONE", label: "No Limit" },
];

/** Why a limit that exists does not apply, in words */
const NOT_APPLIED_REASONS: Readonly<Record<string, string>> = {
	DIRECT_WINS: "the Direct Limit applies",
	TEAM_WINS: "a Team Limit applies",
	UNLIMITED_TEAM_WINS: "an Unlimited Team Limit applies",
	PUBLIC_WINS: "the Public Use Limit applies",
	ALL_MODELS_WINS: "the User's Total Model Limit applies",
	NOT_PUBLIC: "the model is not public",
};

/** The source kinds the labels know */
const BILLED_LIMIT_TYPES: readonly string[] = [
	"DIRECT",
	"TEAM",
	"PUBLIC",
	"ALL_MODELS",
	"PLATFORM",
];

/**
 * @param row - a person's effective access on a model
 * @param filter - the Limit Applied By filter
 * @returns whether the filter shows them
 */
export const matchesBilledTo = (
	row: EffectivePermissionRow,
	filter: BilledToFilter,
): boolean => {
	if (filter === "ALL") {
		return true;
	}
	const limitType = row.usage?.billedTo?.limitType ?? null;
	return filter === "NONE" ? limitType === null : limitType === filter;
};

/**
 * @param row - a person's effective access on a model
 * @returns whether nothing caps their calls: no limit applies, or the source
 * billed is Unlimited. The model total still does.
 */
export const isNotCapped = (row: EffectivePermissionRow): boolean =>
	!row.usage?.billedTo || row.usage.unlimited;

/** The limit that applies to a person's calls, and where it is set */
export interface EffectiveLimit {
	/** The billed source's limit, Unlimited included, or null when no limit applies */
	limit: ModelUsageLimit | null;
	/** Where it is set, which decides how its counts are said */
	source: ModelUsageLimitSource;
}

/**
 * @param usage - which limit applies to a person's calls
 * @returns the limit applied and where it is set
 */
export const getEffectiveLimit = (
	usage: EffectiveUsage | null,
): EffectiveLimit => {
	if (!usage?.billedTo) {
		return { limit: null, source: "DIRECT" };
	}
	const limitType = usage.billedTo.limitType;
	const source: ModelUsageLimitSource =
		limitType === "TEAM" ||
		limitType === "PUBLIC" ||
		limitType === "ALL_MODELS"
			? limitType
			: limitType === "PLATFORM"
				? "PLATFORM"
				: "DIRECT";
	return {
		limit: usage.unlimited
			? { unlimited: true, rules: [] }
			: { unlimited: false, rules: usage.rules },
		source,
	};
};

/**
 * @param item - a limit that exists but is replaced
 * @returns it in words, such as "Data Team Limit does not apply: the Direct Limit applies"
 */
export const describeNotApplied = (item: UsageNotApplied): string => {
	const label = BILLED_LIMIT_TYPES.includes(item.limitType)
		? getUsageSourceLabel(item.limitType as UsageBilledLimitType, item.id)
		: item.limitType;
	return `${label} does not apply: ${NOT_APPLIED_REASONS[item.reason] ?? item.reason}`;
};
