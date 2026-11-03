import type { ModelUsageLimitSource } from "./model-usage-limit-format";
import { getUsageSourceLabel } from "./usage-limit-labels";

/*
 * The words of How Usage Limits Work, the guide to the rules, kept in one place.
 * The order of USAGE_LIMIT_CEILINGS and USAGE_LIMIT_ORDER is the order the
 * backend checks limits in (ModelUsageLimitResolver.resolve in Semoss): keep
 * them the same.
 */

/** Who sets a limit */
export type UsageLimitSetter = "OWNERS" | "ADMINS";

/** One limit as the guide explains it */
export interface UsageLimitGuideSource {
	/** Which limit */
	source: ModelUsageLimitSource;
	/** What the UI calls it */
	label: string;
	/** Who sets it, which decides whether the viewer is told they can */
	setBy: UsageLimitSetter;
	/** What it covers */
	covers: string;
	/** Where in SEMOSS it is set, as a sentence */
	setIn: string;
	/** When it does not apply, as a sentence, or null when it always can */
	skipped: string | null;
}

/** The sections of the guide, in the order they show */
export const USAGE_LIMIT_GUIDE_SECTIONS = [
	"order",
	"modes",
	"rules",
	"teams",
	"who",
	"setups",
	"see",
] as const;

/** A section of the guide */
export type UsageLimitGuideSection =
	(typeof USAGE_LIMIT_GUIDE_SECTIONS)[number];

/** The guide's title */
export const USAGE_LIMIT_GUIDE_TITLE = "How Usage Limits Work";

/** What the guide is, under its title */
export const USAGE_LIMIT_GUIDE_DESCRIPTION =
	"Which usage limit applies to a call, and who sets each one.";

/** Each section's title */
export const USAGE_LIMIT_GUIDE_SECTION_TITLES: Readonly<
	Record<UsageLimitGuideSection, string>
> = {
	order: "How a Limit Is Picked",
	modes: "No Limit Defined, Unlimited and Rules",
	rules: "What Rules Count",
	teams: "Team Limits",
	who: "Who Sets Each Limit",
	setups: "Common Setups",
	see: "See It for One Person",
};

/** Each section in a few words, under its title */
export const USAGE_LIMIT_GUIDE_SECTION_SUMMARIES: Readonly<
	Record<UsageLimitGuideSection, string>
> = {
	order: "The ceilings, then the first limit defined",
	modes: "What each choice in the limit editor does",
	rules: "Measures, windows, and shared or each person",
	teams: "Which team a call counts against",
	who: "Owners, admins, and what editors can do",
	setups: "The limits that reach common goals",
	see: "Where to see how limits apply to someone",
};

/** Who sets a limit, beside it */
export const USAGE_LIMIT_SETTER_LABELS: Readonly<
	Record<UsageLimitSetter, string>
> = {
	OWNERS: "Set by the model's owners",
	ADMINS: "Set by admins",
};

/** What the ceilings are, also above the ceilings of a person's path */
export const CEILINGS_INTRO =
	"Checked on every call, whatever limit applies. A call must be within each one.";

/** How the limit applied is picked, also above the steps of a person's path */
export const LIMIT_APPLIED_BY_INTRO =
	"The first limit defined applies. Team limits are tried in order, and calls move on to the next team when one is used up.";

/** How a limit is picked, above the ceilings and the order */
export const ORDER_INTRO =
	"Every call is checked against the ceilings, then counts against one limit: the first one defined, in this order.";

/** What happens when no limit in the order is defined */
export const ORDER_NONE_DEFINED =
	"When none of them is defined, no limit applies beyond the ceilings.";

/** The ceilings, in the order they are checked */
export const USAGE_LIMIT_CEILINGS: readonly UsageLimitGuideSource[] = [
	{
		source: "MODEL_TOTAL",
		label: getUsageSourceLabel("MODEL_TOTAL"),
		setBy: "OWNERS",
		covers: "Every call to the model, from everyone together.",
		setIn: "On the model's Access Control tab, in Model Usage Limits.",
		skipped: null,
	},
	{
		source: "TEAM_TOTAL",
		label: "Team Total",
		setBy: "ADMINS",
		covers: "Every call a team's limits apply to, on any model. When it is reached, calls move on to the person's next team.",
		setIn: "On the team's page in Team Permissions, in admin settings.",
		skipped: "Checked only on calls that count against the team.",
	},
];

/** The limits a call can count against, in the order they are tried */
export const USAGE_LIMIT_ORDER: readonly UsageLimitGuideSource[] = [
	{
		source: "DIRECT",
		label: getUsageSourceLabel("DIRECT"),
		setBy: "OWNERS",
		covers: "A person's own grant on the model.",
		setIn: "On the model's Access Control tab: edit the member, or use Bulk Access Management.",
		skipped:
			"Skipped when the person has no grant of their own on the model.",
	},
	{
		source: "TEAM",
		label: getUsageSourceLabel("TEAM"),
		setBy: "OWNERS",
		covers: "The grant of a team the person is in. With more than one, they are tried in order.",
		setIn: "On the model's Access Control tab, in Teams.",
		skipped:
			"Skipped when none of the person's teams has a grant on the model with a limit defined.",
	},
	{
		source: "PUBLIC",
		label: getUsageSourceLabel("PUBLIC"),
		setBy: "OWNERS",
		covers: "Everyone using the model, while it is public.",
		setIn: "On the model's Access Control tab, in Model Usage Limits.",
		skipped: "Skipped when the model is not public.",
	},
	{
		source: "ALL_MODELS",
		label: getUsageSourceLabel("ALL_MODELS"),
		setBy: "ADMINS",
		covers: "One person's limit on any model where nothing more specific applies.",
		setIn: "On the member, in Member Settings.",
		skipped: null,
	},
	{
		source: "PLATFORM",
		label: getUsageSourceLabel("PLATFORM"),
		setBy: "ADMINS",
		covers: "Everyone with no other limit, on any model.",
		setIn: "In Model Settings, in admin settings.",
		skipped: null,
	},
];

/** A term and what it means, or a goal and how to reach it */
export interface UsageLimitGuideEntry {
	/** The term, or the goal */
	term: string;
	/** What it means, or how */
	text: string;
}

/** The three ways a limit can be defined */
export const USAGE_LIMIT_MODES: readonly UsageLimitGuideEntry[] = [
	{
		term: "No Limit Defined",
		text: "This limit says nothing, so the next one in the order decides. It never lifts a limit further down: a team with No Limit Defined on a public model leaves its members on the Public Use Limit.",
	},
	{
		term: "Unlimited",
		text: "The search stops here, and the calls have no cap apart from the ceilings. The Model Total, the Team Total and the General Platform Limit cannot be Unlimited; leave them with No Limit Defined to have none.",
	},
	{
		term: "Rules",
		text: "The search stops here, and every rule applies: a call must be within all of them, so the first rule used up stops it.",
	},
];

/** What rules count, and how */
export const USAGE_LIMIT_RULE_TERMS: readonly UsageLimitGuideEntry[] = [
	{
		term: "Measures",
		text: "Tokens count every token, in and out. Cost, in US dollars, is offered only on models with known prices; a cost rule across all models counts only the models that have them. Compute Time is the time the model spends answering, the measure for self-hosted models.",
	},
	{
		term: "Windows",
		text: "From a minute to a year. Minute and hour rules slide, and can be longer, such as every 10 minutes or every 6 hours. Day, week, month and year rules start again at the start of each calendar day, week, month or year in UTC. Times are shown in your time zone.",
	},
	{
		term: "Shared or each person",
		text: "A Team Limit's rules are Shared by the Team, one total for all its members together, or For Each Member, the same amount for each. The Public Use Limit's rules are Shared by All Public Use or For Each Person. A shared rule and a for each member rule together cap both the team and any one person; a for each member rule is a cap, not a share set aside. The Model Total and the Team Total are shared. Every other limit counts one person's own calls.",
	},
	{
		term: "Never past a limit",
		text: "Each call's answer is cut short to fit what its limits have left, so calls do not go past a token or cost limit. A call is refused when fewer than 256 tokens of answer would fit. Calls measured by Compute Time run to the end, so they can go past it.",
	},
];

/** How Team Limits are tried when a person is in more than one team */
export const USAGE_LIMIT_TEAM_RULES: readonly string[] = [
	"When a person is in more than one team with a limit on the model, their calls count against one team at a time. Unlimited teams come first, then the team they got access through first: the later of when they joined the team and when the team got its grant.",
	"When that team's limit or its Team Total is used up, calls move on to the next team. A call is refused only when every team is used up.",
	"A call counts against one team only, and a call that counts against a person's Direct Limit counts against no team.",
	"Teams from a login provider, such as Microsoft groups, work the same way. Their members are known only from each person's sign-in, so Effective Permissions cannot list who uses a provider team's shared total, and their order uses when the team got its grant.",
];

/** Who sets each limit, and what that means for everyone else */
export const USAGE_LIMIT_WHO_RULES: readonly string[] = [
	"A model's owners set its limits: Direct Limits, Team Limits, the Public Use Limit and the Model Total. Admins set the limits across all models: each person's User's Total Model Limit, Team Totals and the General Platform Limit. Admins in admin mode can also set any model's limits.",
	"Editors add people and change the level of Read-Only and Editor people, and each person's limit stays as it is. They see every limit, but only owners can set usage limits, and only owners can end or shorten the access of someone with a usage limit, since the limit goes with it.",
	"Nobody is exempt by role: owners and editors are limited like anyone else. An owner who wants no cap sets their own Direct Limit to Unlimited.",
	"A limit belongs to the grant it is set on, so removing the grant removes its limit.",
];

/** What the viewer can set, when it is known */
export const USAGE_LIMIT_VIEWER_NOTES = {
	/** For an admin in admin mode */
	admin: "In admin mode you can set every limit.",
	/** For one of the model's owners */
	owner: "You can set this model's limits.",
	/** For anyone else who manages the model's access */
	editor: "Only owners can set usage limits. You can see them, and the limits you can set are marked.",
} as const;

/** What a viewer who can set a limit sees beside it */
export const USAGE_LIMIT_CAN_SET_LABEL = "You can set this";

/** Common goals, and the limits that reach them */
export const USAGE_LIMIT_SETUPS: readonly UsageLimitGuideEntry[] = [
	{
		term: "Exempt one person",
		text: "Give them their own grant with an Unlimited Direct Limit.",
	},
	{
		term: "Give one person more or less than the Public Use Limit",
		text: "Give them their own Read-Only grant with a Direct Limit.",
	},
	{
		term: "Exempt a team",
		text: "Set its Team Limit to Unlimited.",
	},
	{
		term: "Give a team its own limit on a public model",
		text: "Give the team a Read-Only grant with a Team Limit.",
	},
	{
		term: "Add a team to a public model and keep the Public Use Limit",
		text: "Give the team a grant with No Limit Defined.",
	},
	{
		term: "Cap the whole model, whoever uses it",
		text: "Set a Model Total.",
	},
	{
		term: "Cap a team across every model",
		text: "An admin sets its Team Total.",
	},
	{
		term: "Set a default for everyone",
		text: "An admin sets the General Platform Limit, and a User's Total Model Limit for anyone who needs a different one.",
	},
];

/** Where to see how limits apply to one person, for someone managing a model */
export const USAGE_LIMIT_SEE_FOR_MANAGERS =
	"Effective Permissions shows the limit applied to each person on a model. How Limits Apply, on a person's row, shows every step for that person, with what is used and when it resets.";

/** Where to see how limits apply to the viewer's own calls */
export const USAGE_LIMIT_SEE_FOR_SELF =
	"Your Usage Limit, on a model's page, shows every limit that applies to your calls and the one they stop at. My Profile shows how much of your limit you have used on each model.";
