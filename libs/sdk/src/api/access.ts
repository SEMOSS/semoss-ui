import { Env } from "../env";
import { get, post } from "../utility/fetch";

/**
 * What a permission batch changes: a project, an engine, an insight, a custom
 * team's members (TEAM) or a custom team's managers (TEAM_MANAGERS)
 */
export type PermissionTargetResourceType =
	| "PROJECT"
	| "ENGINE"
	| "INSIGHT"
	| "TEAM"
	| "TEAM_MANAGERS";

/** A project, engine or insight, or a custom team's members or managers */
export interface PermissionTargetResource {
	/** What it is */
	resourceType: PermissionTargetResourceType;
	/** Its id; for a team, the team name */
	id: string;
	/** The project an insight belongs to */
	projectId?: string;
}

/** Who a change is for */
export interface PermissionSubject {
	/** A person, or a team on a project, engine or insight */
	category: "USER" | "TEAM";
	/** The user id or team name */
	id: string;
	/** The person's login type, or the team's type such as CUSTOM */
	type: string;
}

/** What a model usage rule counts */
export type ModelUsageMetric = "TOKENS" | "COST" | "COMPUTE_TIME";

/**
 * How long a rule's count runs before it starts again. Minute and hour slide;
 * day and longer are fixed calendar windows in UTC.
 */
export type ModelUsageWindow =
	| "MINUTE"
	| "HOUR"
	| "DAY"
	| "WEEK"
	| "MONTH"
	| "YEAR";

/**
 * Whose use a rule counts: each person's own use (EACH_PERSON), or every call
 * billed to a team, the public use or the model together (SHARED)
 */
export type ModelUsageCounts = "EACH_PERSON" | "SHARED";

/**
 * One rule of a model usage limit, such as 100,000 tokens a minute or 100,000
 * tokens every 10 minutes
 */
export interface ModelUsageLimitRule {
	/** What it counts */
	metric: ModelUsageMetric;
	/**
	 * Tokens, millionths of a US dollar or milliseconds. Every rule read or sent
	 * has one; it is null only while a rule is still being typed in an editor.
	 */
	amount: number | null;
	/** How long its count runs */
	window: ModelUsageWindow;
	/**
	 * How many minutes or hours its window spans, such as 10 for every 10
	 * minutes: 1 to 59 on a MINUTE window and 1 to 24 on an HOUR window. Left out
	 * for 1, and on every longer window; the backend leaves it out when it is 1,
	 * and a rule sends it only when it is more than 1.
	 */
	windowLength?: number;
	/** Whose use it counts */
	counts: ModelUsageCounts;
}

/**
 * What one source allows on a model: Unlimited, or a list of rules that must
 * all have room. Null wherever a limit is read or sent means no limit defined.
 */
export interface ModelUsageLimit {
	/** An explicit choice of no cap; the limit then has no rules */
	unlimited: boolean;
	/** The rules, every one of which a call must pass */
	rules: ModelUsageLimitRule[];
}

/** A model's public use limit, which applies while the model is public */
export interface ModelPublicUse {
	/** Whether the model is public now */
	isPublic: boolean;
	/** Its limit, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
}

/** A model's total budget, for everyone together */
export interface ModelTotal {
	/** Its limit, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
}

/**
 * The price entry a model's cost rules use, in US dollars per million tokens.
 * A rate the entry does not have is null.
 */
export interface ModelPrice {
	/** The serving provider the entry is for */
	servingProvider: string | null;
	/** The provider's model id */
	modelId: string | null;
	/** Uncached input */
	input: number | null;
	/** Output */
	output: number | null;
	/** Cache reads */
	cache_read: number | null;
	/** Cache writes */
	cache_write: number | null;
	/** Thinking */
	reasoning: number | null;
}

/**
 * A model's public use or its total, whose usage limit a batch can change on
 * a model engine
 */
export interface ModelLimitSubject {
	/** PUBLIC for the public use limit, MODEL for the model total */
	category: "PUBLIC" | "MODEL";
}

/** A person, with the details Bulk Access Management shows */
export interface AccessPerson extends PermissionSubject {
	/** Always a person */
	category: "USER";
	/** Display name */
	name: string | null;
	/** Email address */
	email: string | null;
}

/** The access levels a permission batch gives */
export type AccessLevel = "OWNER" | "EDIT" | "READ_ONLY";

/** The whole access a subject has or is given */
export interface PermissionGrant {
	/** The access level */
	level: AccessLevel;
	/** When the access ends, as an ISO date and time with a zone, or null */
	endDate?: string | null;
	/**
	 * A model engine's usage limit on the grant, or null for no limit defined.
	 * A person's rules count only their own use; a team's can be shared or for
	 * each member.
	 */
	usageLimit?: ModelUsageLimit | null;
}

/** One change to a person's or team's access in a permission batch */
export interface PermissionAccessChange {
	/** Give access, change it, or take it away */
	action: "ADD" | "CHANGE" | "REMOVE";
	/** Who it is for */
	subject: PermissionSubject;
	/**
	 * The access to give. A change sets the whole access, so leaving out the
	 * end date or a limit clears it. Unused when removing, and for team members.
	 */
	to?: PermissionGrant;
}

/**
 * A change to a model's public use limit or its total. Only on a model engine,
 * only by its owners and admins, and only as a CHANGE.
 */
export interface ModelLimitChange {
	/** Always a change */
	action: "CHANGE";
	/** The public use or the model total */
	subject: ModelLimitSubject;
	/** The new limit, or null for no limit defined */
	to: { usageLimit: ModelUsageLimit | null };
}

/** One change in a permission batch */
export type PermissionChange = PermissionAccessChange | ModelLimitChange;

/** The changes to one target */
export interface PermissionBatch {
	/** What changes */
	target: PermissionTargetResource;
	/** The changes */
	changes: PermissionChange[];
}

/** Whether one change of a permission batch can be made */
export interface PermissionChangeValidation {
	/** Its index in the batch's changes */
	index: number;
	/** Whether it can be made */
	allowed: boolean;
	/** Why not, when it cannot */
	reason: string | null;
}

/** What validating one permission batch found */
export interface PermissionBatchValidation {
	/** The batch's target */
	target: PermissionTargetResource;
	/** Why none of the batch can be made, such as a target in two batches */
	reason: string | null;
	/** Each change, in the batch's order */
	changes: PermissionChangeValidation[];
}

/** What saving permission batches did */
export interface PermissionBatchSaveResult {
	/** How many targets changed */
	targets: number;
	/** How many changes were saved */
	changes: number;
}

/** A person or team with the access they have now */
export interface CurrentAccess<
	S extends PermissionSubject = PermissionSubject,
> {
	/** Who */
	subject: S;
	/** Their access */
	access: PermissionGrant;
}

/** What the signed in user may change on a project or engine */
export interface PermissionAllowedChanges {
	/** Whether they can give, change and take away people's access */
	canChangePeople: boolean;
	/** Whether they can give or change Author access */
	canGiveAuthorAccess: boolean;
	/** Whether they can change which teams have access */
	canChangeTeams: boolean;
	/** Whether only admins can give people access to it */
	addsAreAdminOnly: boolean;
	/**
	 * On a model, the access levels whose people's usage limits the user may
	 * set or change: every level for its owners and for admins in admin mode,
	 * and none for anyone else. Only owners set usage limits, so an editor's
	 * level change carries each limit forward as it is.
	 */
	limitLevels: AccessLevel[];
	/**
	 * On a model, whether the user can set or change team limits, the public
	 * use limit and the model total: its owners, and admins in admin mode
	 */
	canChangeModelLimits: boolean;
}

/** Who can use a project or engine now */
export interface ResourcePermissions {
	/** The people given access directly */
	people: CurrentAccess<AccessPerson>[];
	/** The teams that have access */
	teams: CurrentAccess[];
	/** What the signed in user may change */
	allowedPermissionChanges: PermissionAllowedChanges;
	/** A model's public use limit and whether it is public; null for anything else */
	publicUse: ModelPublicUse | null;
	/** A model's total for everyone together; null for anything else */
	modelTotal: ModelTotal | null;
	/** Whether the model has known prices, so its limits can have cost rules */
	costLimitsAvailable: boolean;
	/** The price entry the model's cost rules use, or null */
	price: ModelPrice | null;
}

/** A person to copy from a source, with their access on the source and the target */
export interface PermissionsToCopy {
	/** The person */
	subject: AccessPerson;
	/** Their access on the source, or null when the source is a team */
	source: PermissionGrant | null;
	/** Their access on the target, or null when they have none or the target is a team */
	target: PermissionGrant | null;
	/** Whether they are already in the target */
	inTarget: boolean;
}

/** Where part of a person's access comes from */
export type PermissionSource =
	| {
			/** Given to them directly */
			sourceType: "DIRECT";
			/** The access */
			level: AccessLevel;
			/** When it ends, or null */
			endDate: string | null;
	  }
	| {
			/** Through a custom team they are in */
			sourceType: "TEAM";
			/** The team's name */
			id: string;
			/** The team's type */
			type: string;
			/** The access the team gives */
			level: AccessLevel;
			/** When the team's access ends, or null */
			endDate: string | null;
	  };

/**
 * The source a person's calls to a model count against: their own grant
 * (DIRECT), a team's grant, the model's public use, their own default for all
 * models, or the platform default
 */
export type UsageBilledLimitType =
	| "DIRECT"
	| "TEAM"
	| "PUBLIC"
	| "ALL_MODELS"
	| "PLATFORM";

/** The source a person's calls are billed to */
export interface UsageBilledTo {
	/** Which source: the type of limit billed */
	limitType: UsageBilledLimitType;
	/** The person's id for DIRECT/ALL_MODELS, or the team's id for TEAM. */
	id: string | null;
	/** The person's login type for DIRECT/ALL_MODELS, or the team's type for TEAM. */
	type: string | null;
}

/** A team a person's calls move on to, in billing order */
export interface UsageNextTeam {
	/** The team's name */
	id: string;
	/** The team's type */
	type: string;
	/** Whether its limit is Unlimited */
	unlimited: boolean;
	/** Its rules */
	rules: ModelUsageLimitRule[];
}

/** A limit that exists for a person but is replaced by another */
export interface UsageNotApplied {
	/** Which source, such as TEAM */
	limitType: UsageBilledLimitType;
	/** The person's id for DIRECT/ALL_MODELS, or the team's id for TEAM. */
	id: string | null;
	/** The person's login type for DIRECT/ALL_MODELS, or the team's type for TEAM. */
	type: string | null;
	/**
	 * Why it does not apply: DIRECT_WINS, TEAM_WINS, UNLIMITED_TEAM_WINS,
	 * PUBLIC_WINS, ALL_MODELS_WINS or NOT_PUBLIC
	 */
	reason: string;
}

/** Which usage limit a person's calls to a model are billed to */
export interface EffectiveUsage {
	/** The source billed now, or null when no limit applies */
	billedTo: UsageBilledTo | null;
	/** Whether the billed source is Unlimited */
	unlimited: boolean;
	/** The billed source's rules */
	rules: ModelUsageLimitRule[];
	/** For a team, the other teams in billing order */
	nextTeams: UsageNextTeam[];
	/** Limits that exist but are replaced */
	notApplied: UsageNotApplied[];
}

/** A cap checked on every call to a model, and never billed */
export interface UsageCeiling {
	/** Which cap: the model total */
	limitType: "MODEL_TOTAL";
	/** Its limit, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
}

/** A person who can use a project or engine, and where their access comes from */
export interface EffectivePermissionRow {
	/** The person */
	subject: AccessPerson;
	/** The most access any source gives them */
	level: AccessLevel;
	/** Every source of their access, the most access first */
	sources: PermissionSource[];
	/** On a model, which usage limit their calls are billed to; null otherwise */
	usage: EffectiveUsage | null;
}

/** A team whose members come from a login provider, so they are not listed */
export interface UnlistedTeam {
	/** The team's name */
	id: string;
	/** The team's type, such as MICROSOFT */
	type: string;
	/** The access the team gives */
	level: AccessLevel;
	/** On a model, the team's limit, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
}

/** Everyone who can use a project or engine in the end */
export interface EffectivePermissions {
	/** One row per person */
	people: EffectivePermissionRow[];
	/** Teams whose members come from a login provider, so they are not listed */
	unlistedTeams: UnlistedTeam[];
	/** A model's public use limit and whether it is public; null for anything else */
	publicUse: ModelPublicUse | null;
	/** The caps on every call to a model; empty for anything else */
	ceilings: UsageCeiling[];
}

/** A step of how usage limits apply to a person's call */
export type UsageLimitType =
	| "MODEL_TOTAL"
	| "DIRECT"
	| "TEAM"
	| "PUBLIC"
	| "ALL_MODELS"
	| "PLATFORM";

/**
 * Where a call stands at a step: REACHED refuses it, BILLED is the source it
 * counts against, CHECKED is a ceiling not reached, NEXT is a team calls move on
 * to, SKIPPED does not apply, NOT_DEFINED has no limit, NOT_REACHED comes after
 * the source billed, and DEFINED has a limit that was not checked
 */
export type UsageLimitStepState =
	| "DEFINED"
	| "NOT_DEFINED"
	| "SKIPPED"
	| "NOT_REACHED"
	| "CHECKED"
	| "BILLED"
	| "NEXT"
	| "REACHED";

/** One rule of a step, with how much of it is used */
export interface UsageLimitRuleUsage extends ModelUsageLimitRule {
	/** How much is used in the current window, or null when it is not known */
	used: number | null;
	/** When the window starts again, as an ISO date and time in UTC, or null */
	resetsAt: string | null;
}

/** One step of how usage limits apply to a person on a model */
export interface UsageLimitPathStep {
	/** A ceiling, checked on every call, or a source the call may be billed to */
	layer: "CEILING" | "BILLED";
	/** Which ceiling or source the step checks */
	limitType: UsageLimitType;
	/** The person's id for DIRECT/ALL_MODELS, or the team's id for TEAM. */
	id: string | null;
	/** The person's login type for DIRECT/ALL_MODELS, or the team's type for TEAM. */
	type: string | null;
	/** Where the call stands at this step */
	state: UsageLimitStepState;
	/** Why it is skipped: NOT_PUBLIC or NO_GRANT, or null */
	reason: string | null;
	/** For a team, when the person got access through it, in UTC, or null */
	accessSince: string | null;
	/** Whether its limit is Unlimited */
	unlimited: boolean;
	/** Its rules, with what is used; empty when they are hidden */
	rules: UsageLimitRuleUsage[];
	/**
	 * Whether the backend left out the rules of this step: outside admin mode,
	 * the rules of someone else's User's Total Model Limit and General Platform
	 * Limit are seen only by admins. False when not sent.
	 */
	rulesHidden?: boolean;
	/** For a team, its total across all models, or null when not sent */
	teamTotal: { unlimited: boolean; rules: UsageLimitRuleUsage[] } | null;
}

/** How usage limits apply to one person on one model, step by step */
export interface UsageLimitPath {
	/** The model */
	engineId: string;
	/** The person, by their primary login */
	person: { id: string; type: string | null };
	/** Which source the person's calls are billed to, or null when none */
	billedLimitType: UsageBilledLimitType | null;
	/** The ceilings, checked on every call */
	ceilings: UsageLimitPathStep[];
	/** The sources, in the order they are tried */
	steps: UsageLimitPathStep[];
}

/**
 * @param admin - Whether to use admin mode, where an admin can change and read
 * anything; outside it an admin has only their own permissions
 * @returns the base URL of the permission batch calls
 */
const permissionBatchUrl = (admin: boolean): string =>
	`${Env.MODULE}/api/auth/${admin ? "admin/" : ""}permissionBatch`;

const LEVELS: readonly string[] = ["OWNER", "EDIT", "READ_ONLY"];

/** Narrows a value to an object */
const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a non-blank string, or null */
const readText = (value: unknown): string | null =>
	typeof value === "string" && value.trim() !== "" ? value : null;

/** Reads a finite number, or null */
const readNumber = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

const TARGET_RESOURCE_TYPES: readonly string[] = [
	"PROJECT",
	"ENGINE",
	"INSIGHT",
	"TEAM",
	"TEAM_MANAGERS",
];

/** Reads a target's resource type, or null */
const readTargetResourceType = (
	value: unknown,
): PermissionTargetResourceType | null =>
	typeof value === "string" && TARGET_RESOURCE_TYPES.includes(value)
		? (value as PermissionTargetResourceType)
		: null;

/** Reads an access level, or null */
const readLevel = (value: unknown): AccessLevel | null =>
	typeof value === "string" && LEVELS.includes(value)
		? (value as AccessLevel)
		: null;

const METRICS: readonly string[] = ["TOKENS", "COST", "COMPUTE_TIME"];

const WINDOWS: readonly string[] = [
	"MINUTE",
	"HOUR",
	"DAY",
	"WEEK",
	"MONTH",
	"YEAR",
];

const BILLED_LIMIT_TYPES: readonly string[] = [
	"DIRECT",
	"TEAM",
	"PUBLIC",
	"ALL_MODELS",
	"PLATFORM",
];

const LIMIT_TYPES: readonly string[] = ["MODEL_TOTAL", ...BILLED_LIMIT_TYPES];

const STEP_STATES: readonly string[] = [
	"DEFINED",
	"NOT_DEFINED",
	"SKIPPED",
	"NOT_REACHED",
	"CHECKED",
	"BILLED",
	"NEXT",
	"REACHED",
];

/** Reads a list, or an empty one when the value is not a list */
const readOptionalList = (value: unknown): unknown[] =>
	Array.isArray(value) ? value : [];

/** The windows a rule can give a length to */
const WINDOWS_WITH_LENGTH: readonly string[] = ["MINUTE", "HOUR"];

/**
 * Reads one rule of a usage limit, or null when its metric, window or counts
 * is not known, or it has no amount. A window length
 * is kept when it is a whole number above 1 on a minute or hour window; a
 * missing or null one means 1, so it is left out.
 * @param value - The rule the backend sent
 * @returns The rule, or null
 */
const readRule = (value: unknown): ModelUsageLimitRule | null => {
	if (!isObject(value)) {
		return null;
	}
	const { metric, window } = value;
	const counts: ModelUsageCounts | null =
		value.counts === "SHARED" || value.counts === "EACH_PERSON"
			? value.counts
			: null;
	const amount = readNumber(value.amount);
	if (
		typeof metric !== "string" ||
		!METRICS.includes(metric) ||
		typeof window !== "string" ||
		!WINDOWS.includes(window) ||
		!counts ||
		amount === null
	) {
		return null;
	}
	const length = readNumber(value.windowLength);
	const windowLength =
		WINDOWS_WITH_LENGTH.includes(window) &&
		length !== null &&
		Number.isInteger(length) &&
		length > 1
			? length
			: null;
	return {
		metric: metric as ModelUsageMetric,
		amount,
		window: window as ModelUsageWindow,
		...(windowLength !== null ? { windowLength } : {}),
		counts,
	};
};

/**
 * Reads a model usage limit from a response, or from a row of an endpoint
 * that lists people with their limits, such as `getEngineUsers`. The backend
 * leaves out null fields, so a missing limit is null, a rule with no amount is
 * left out, and a missing window length is 1, which the rule leaves out. A
 * limit that is neither Unlimited nor has a rule is no limit defined.
 * @param value - The limit the backend sent, as an object or a JSON string
 * @returns The limit, or null for no limit defined
 */
export const readModelUsageLimit = (value: unknown): ModelUsageLimit | null => {
	let parsed = value;
	if (typeof value === "string" && value.trim() !== "") {
		try {
			parsed = JSON.parse(value);
		} catch {
			return null;
		}
	}
	if (!isObject(parsed)) {
		return null;
	}
	if (parsed.unlimited === true) {
		return { unlimited: true, rules: [] };
	}
	const rules = readOptionalList(parsed.rules).flatMap(
		(rule) => readRule(rule) ?? [],
	);
	return rules.length > 0 ? { unlimited: false, rules } : null;
};

/** Reads a grant, or null when it has no known level */
const readGrant = (value: unknown): PermissionGrant | null => {
	if (!isObject(value)) {
		return null;
	}
	const level = readLevel(value.level);
	if (!level) {
		return null;
	}
	return {
		level,
		endDate: readText(value.endDate),
		usageLimit: readModelUsageLimit(value.usageLimit),
	};
};

/** Reads a model's public use, or null when the response has none */
const readPublicUse = (value: unknown): ModelPublicUse | null =>
	isObject(value)
		? {
				isPublic: value.isPublic === true,
				usageLimit: readModelUsageLimit(value.usageLimit),
			}
		: null;

/** Reads a model's price entry, or null when it has none */
const readPrice = (value: unknown): ModelPrice | null =>
	isObject(value)
		? {
				servingProvider: readText(value.servingProvider),
				modelId: readText(value.modelId),
				input: readNumber(value.input),
				output: readNumber(value.output),
				cache_read: readNumber(value.cache_read),
				cache_write: readNumber(value.cache_write),
				reasoning: readNumber(value.reasoning),
			}
		: null;

/** Reads the levels whose limits the user may change */
const readLevels = (value: unknown): AccessLevel[] =>
	readOptionalList(value).flatMap((level) => readLevel(level) ?? []);

/** Reads a person, or null when they have no id or login type */
const readPerson = (value: unknown): AccessPerson | null => {
	if (!isObject(value)) {
		return null;
	}
	const id = readText(value.id);
	const type = readText(value.type);
	if (!id || !type) {
		return null;
	}
	return {
		category: "USER",
		id,
		type,
		name: readText(value.name),
		email: readText(value.email),
	};
};

/** Reads a list, or throws when the response is not one */
const readList = (value: unknown, what: string): unknown[] => {
	if (!Array.isArray(value)) {
		throw Error(`No Response to ${what}`);
	}
	return value;
};

/**
 * Read who can use a project or engine now, in the shape permission batches
 * use, and what the signed in user may change. End dates come back as ISO dates
 * and times in UTC, so a batch can send them back as they are. On a model, each
 * grant carries its usage limit, and the response adds the public use limit,
 * the model total, and whether cost rules are possible.
 * @param target - The project or engine
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people, the teams and the changes the user may make. Rows without a known
 * level, id or type are left out.
 */
export const getResourcePermissions = async (
	target: PermissionTargetResource,
	admin = false,
): Promise<ResourcePermissions> => {
	const params = new URLSearchParams({
		resourceType: target.resourceType,
		id: target.id,
	});
	const response = await get<unknown>(
		`${permissionBatchUrl(admin)}/getPermissions?${params.toString()}`,
	);
	const data: unknown = response?.data;
	if (!isObject(data) || !isObject(data.allowedPermissionChanges)) {
		throw Error("No Response to read the permissions");
	}
	const allowed = data.allowedPermissionChanges;
	return {
		people: readList(data.people, "read the permissions").flatMap((row) => {
			const subject = isObject(row) ? readPerson(row.subject) : null;
			const access = isObject(row) ? readGrant(row.access) : null;
			return subject && access ? [{ subject, access }] : [];
		}),
		teams: readList(data.teams, "read the permissions").flatMap((row) => {
			if (!isObject(row) || !isObject(row.subject)) {
				return [];
			}
			const id = readText(row.subject.id);
			const type = readText(row.subject.type);
			const access = readGrant(row.access);
			return id && type && access
				? [{ subject: { category: "TEAM" as const, id, type }, access }]
				: [];
		}),
		allowedPermissionChanges: {
			canChangePeople: allowed.canChangePeople === true,
			canGiveAuthorAccess: allowed.canGiveAuthorAccess === true,
			canChangeTeams: allowed.canChangeTeams === true,
			addsAreAdminOnly: allowed.addsAreAdminOnly === true,
			limitLevels: readLevels(allowed.limitLevels),
			canChangeModelLimits: allowed.canChangeModelLimits === true,
		},
		publicUse: readPublicUse(data.publicUse),
		modelTotal: isObject(data.modelTotal)
			? { usageLimit: readModelUsageLimit(data.modelTotal.usageLimit) }
			: null,
		costLimitsAvailable: data.costLimitsAvailable === true,
		price: readPrice(data.price),
	};
};

/** One of a custom team's lists of people: its members or its managers */
export type TeamRole = "MEMBERS" | "MANAGERS";

/** The people in one of a custom team's lists, for its Bulk Access Management */
export interface TeamPeople {
	/** The team's members, or its managers */
	people: AccessPerson[];
	/** Whether the signed in user can change them: the team's managers, or admins in admin mode */
	canChange: boolean;
}

/**
 * Read everyone in one of a custom team's lists: its members or its managers.
 * Its managers only, or admins in admin mode.
 * @param groupId - The team
 * @param role - Which list to read
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people and whether the user can change them. Rows without an
 * id or login type are left out.
 */
export const getTeamPeople = async (
	groupId: string,
	role: TeamRole,
	admin = false,
): Promise<TeamPeople> => {
	const what = role === "MANAGERS" ? "managers" : "members";
	const params = new URLSearchParams({
		resourceType: role === "MANAGERS" ? "TEAM_MANAGERS" : "TEAM",
		id: groupId,
	});
	const response = await get<unknown>(
		`${permissionBatchUrl(admin)}/getPermissions?${params.toString()}`,
	);
	const data: unknown = response?.data;
	if (!isObject(data) || !isObject(data.allowedPermissionChanges)) {
		throw Error(`No Response to read the team's ${what}`);
	}
	return {
		people: readList(data.people, `read the team's ${what}`).flatMap(
			(row) => {
				const person = isObject(row) ? readPerson(row.subject) : null;
				return person ? [person] : [];
			},
		),
		canChange: data.allowedPermissionChanges.canChangePeople === true,
	};
};

/**
 * Reads what validating one batch found, or throws when it is not well formed:
 * the results are matched to the batches and changes by position and index, so
 * none can be left out.
 * @param row - The result the backend sent
 * @returns The batch's target, why it is blocked, and each change's result
 */
const readBatchValidation = (row: unknown): PermissionBatchValidation => {
	const what = "validate the permission batch";
	const target = isObject(row) && isObject(row.target) ? row.target : null;
	const resourceType = target
		? readTargetResourceType(target.resourceType)
		: null;
	const id = target ? readText(target.id) : null;
	if (!isObject(row) || !target || !resourceType || !id) {
		throw Error(`Unexpected Response to ${what}: a batch has no target`);
	}
	const projectId = readText(target.projectId);
	return {
		target: { resourceType, id, ...(projectId ? { projectId } : {}) },
		reason: readText(row.reason),
		changes: readList(row.changes, what).map((change) => {
			const index = isObject(change) ? readNumber(change.index) : null;
			if (!isObject(change) || index === null) {
				throw Error(
					`Unexpected Response to ${what}: a change has no index`,
				);
			}
			return {
				index,
				allowed: change.allowed === true,
				reason: readText(change.reason),
			};
		}),
	};
};

/**
 * Validate permission batches without saving them. Each change is checked
 * against the same rules as the single permission calls, and against the
 * current access, so a change someone already made or undid is reported.
 * @param batches - The batches; a target can be in only one
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns What validating each batch found, one result per batch in the order sent
 * @throws When the response does not have one well formed result per batch
 */
export const validatePermissionBatches = async (
	batches: PermissionBatch[],
	admin = false,
): Promise<PermissionBatchValidation[]> => {
	const response = await post<unknown>(
		`${permissionBatchUrl(admin)}/validatePermissionBatches`,
		{ batches },
		{},
	);
	const rows = readList(response?.data, "validate the permission batch");
	if (rows.length !== batches.length) {
		throw Error(
			"Unexpected Response to validate the permission batch: not one result per batch",
		);
	}
	return rows.map(readBatchValidation);
};

/**
 * Save permission batches in one transaction: every change of every batch is
 * saved, or none is. People picked from the Microsoft directory without an
 * account are given one first.
 * @param batches - The batches; a target can be in only one
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns How many targets and changes were saved
 * @throws When any change cannot be made, with the reasons
 */
export const savePermissionBatches = async (
	batches: PermissionBatch[],
	admin = false,
): Promise<PermissionBatchSaveResult> => {
	const response = await post<unknown>(
		`${permissionBatchUrl(admin)}/savePermissionBatches`,
		{ batches },
		{},
	);
	const data: unknown = response?.data;
	if (!isObject(data)) {
		throw Error("No Response to save the permission batch");
	}
	return {
		targets: readNumber(data.targets) ?? 0,
		changes: readNumber(data.changes) ?? 0,
	};
};

/**
 * Read the people to copy from a project, engine or custom team into another,
 * with the access each has on both. From a project or engine, only the people
 * given access to it directly are copied, not its teams. A team's members can
 * be read by its managers, and by the owners and editors of a target the team
 * already has access to.
 * @param source - The project, engine or team to copy from
 * @param target - The project, engine or team being changed
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people. Rows without an id or login type are left out.
 */
export const getPermissionsToCopy = async (
	source: PermissionTargetResource,
	target: PermissionTargetResource,
	admin = false,
): Promise<PermissionsToCopy[]> => {
	const params = new URLSearchParams({
		sourceResourceType: source.resourceType,
		sourceId: source.id,
		targetResourceType: target.resourceType,
		targetId: target.id,
	});
	const response = await get<unknown>(
		`${permissionBatchUrl(admin)}/getPermissionsToCopy?${params.toString()}`,
	);
	return readList(response?.data, "read the permissions to copy").flatMap(
		(row) => {
			if (!isObject(row)) {
				return [];
			}
			const subject = readPerson(row.subject);
			return subject
				? [
						{
							subject,
							source: readGrant(row.source),
							target: readGrant(row.target),
							inTarget: row.inTarget === true,
						},
					]
				: [];
		},
	);
};

/**
 * Reads one part of a person's access, or null when it is not a known source
 * @param value - The source the backend sent
 * @returns The source, or null
 */
const readSource = (value: unknown): PermissionSource | null => {
	if (!isObject(value)) {
		return null;
	}
	const level = readLevel(value.level);
	if (!level) {
		return null;
	}
	const endDate = readText(value.endDate);
	if (value.sourceType === "DIRECT") {
		return { sourceType: "DIRECT", level, endDate };
	}
	const id = readText(value.id);
	const type = readText(value.type);
	return value.sourceType === "TEAM" && id && type
		? { sourceType: "TEAM", id, type, level, endDate }
		: null;
};

/** Reads a list of rules, leaving out any it cannot read */
const readRules = (value: unknown): ModelUsageLimitRule[] =>
	readOptionalList(value).flatMap((rule) => readRule(rule) ?? []);

/** Reads which source a person's calls are billed to, or null for none */
const readBilledTo = (value: unknown): UsageBilledTo | null => {
	if (
		!isObject(value) ||
		typeof value.limitType !== "string" ||
		!BILLED_LIMIT_TYPES.includes(value.limitType)
	) {
		return null;
	}
	return {
		limitType: value.limitType as UsageBilledLimitType,
		id: readText(value.id),
		type: readText(value.type),
	};
};

/**
 * Reads which usage limit a person's calls are billed to, or null when the
 * row has none, as for anything but a model
 * @param value - The `usage` the backend sent
 * @returns The usage, or null
 */
const readEffectiveUsage = (value: unknown): EffectiveUsage | null => {
	if (!isObject(value)) {
		return null;
	}
	return {
		billedTo: readBilledTo(value.billedTo),
		unlimited: value.unlimited === true,
		rules: readRules(value.rules),
		nextTeams: readOptionalList(value.nextTeams).flatMap((team) => {
			if (!isObject(team)) {
				return [];
			}
			const id = readText(team.id);
			const type = readText(team.type);
			return id && type
				? [
						{
							id,
							type,
							unlimited: team.unlimited === true,
							rules: readRules(team.rules),
						},
					]
				: [];
		}),
		notApplied: readOptionalList(value.notApplied).flatMap((item) => {
			if (!isObject(item)) {
				return [];
			}
			const source = readBilledTo(item);
			const reason = readText(item.reason);
			return source && reason
				? [
						{
							...source,
							reason,
						},
					]
				: [];
		}),
	};
};

/**
 * Read everyone who can use a project or engine in the end, one row per person,
 * with the access they get directly and through each custom team they are in.
 * Its editors and owners only, or admins in admin mode, since the rows show who
 * is in its teams. On a model, each person's row says which usage limit their
 * calls are billed to, and the response adds the public use limit, the
 * ceilings and each provider team's limit.
 * @param target - The project or engine
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people, and the teams whose members come from a login provider.
 * Rows without an id, login type, known level or source are left out.
 */
export const getEffectivePermissions = async (
	target: PermissionTargetResource,
	admin = false,
): Promise<EffectivePermissions> => {
	const params = new URLSearchParams({
		resourceType: target.resourceType,
		id: target.id,
	});
	const response = await get<unknown>(
		`${permissionBatchUrl(admin)}/getEffectivePermissions?${params.toString()}`,
	);
	const data: unknown = response?.data;
	if (!isObject(data)) {
		throw Error("No Response to read the effective permissions");
	}
	return {
		people: readList(data.people, "read the effective permissions").flatMap(
			(row) => {
				if (!isObject(row)) {
					return [];
				}
				const subject = readPerson(row.subject);
				const level = readLevel(row.level);
				const sources = readOptionalList(row.sources).flatMap(
					(source) => readSource(source) ?? [],
				);
				return subject && level && sources.length > 0
					? [
							{
								subject,
								level,
								sources,
								usage: readEffectiveUsage(row.usage),
							},
						]
					: [];
			},
		),
		unlistedTeams: readList(
			data.unlistedTeams,
			"read the effective permissions",
		).flatMap((row) => {
			if (!isObject(row)) {
				return [];
			}
			const id = readText(row.id);
			const type = readText(row.type);
			const level = readLevel(row.level);
			return id && type && level
				? [
						{
							id,
							type,
							level,
							usageLimit: readModelUsageLimit(row.usageLimit),
						},
					]
				: [];
		}),
		publicUse: readPublicUse(data.publicUse),
		ceilings: readOptionalList(data.ceilings).flatMap((row) =>
			isObject(row) && row.limitType === "MODEL_TOTAL"
				? [
						{
							limitType: "MODEL_TOTAL" as const,
							usageLimit: readModelUsageLimit(row.usageLimit),
						},
					]
				: [],
		),
	};
};

/** Reads one rule of a step with what is used, or null when it cannot be read */
const readRuleUsage = (value: unknown): UsageLimitRuleUsage | null => {
	const rule = readRule(value);
	return rule && isObject(value)
		? {
				...rule,
				used: readNumber(value.used),
				resetsAt: readText(value.resetsAt),
			}
		: null;
};

/** Reads a list of rules with what is used, leaving out any it cannot read */
const readRuleUsages = (value: unknown): UsageLimitRuleUsage[] =>
	readOptionalList(value).flatMap((rule) => readRuleUsage(rule) ?? []);

/**
 * Reads one step of how limits apply, or null when its limit type or state is
 * not known
 * @param value - The step the backend sent
 * @returns The step, or null
 */
const readPathStep = (value: unknown): UsageLimitPathStep | null => {
	if (
		!isObject(value) ||
		typeof value.limitType !== "string" ||
		!LIMIT_TYPES.includes(value.limitType) ||
		typeof value.state !== "string" ||
		!STEP_STATES.includes(value.state)
	) {
		return null;
	}
	const teamTotal = value.teamTotal;
	return {
		layer: value.layer === "CEILING" ? "CEILING" : "BILLED",
		limitType: value.limitType as UsageLimitType,
		id: readText(value.id),
		type: readText(value.type),
		state: value.state as UsageLimitStepState,
		reason: readText(value.reason),
		accessSince: readText(value.accessSince),
		unlimited: value.unlimited === true,
		rules: readRuleUsages(value.rules),
		rulesHidden: value.rulesHidden === true,
		teamTotal: isObject(teamTotal)
			? {
					unlimited: teamTotal.unlimited === true,
					rules: readRuleUsages(teamTotal.rules),
				}
			: null,
	};
};

/**
 * Reads how limits apply to one person, or throws when it is not well formed
 * @param data - What the backend sent
 * @param what - What the call does, for the error
 * @returns The path
 */
const readUsageLimitPath = (data: unknown, what: string): UsageLimitPath => {
	if (!isObject(data) || !isObject(data.person)) {
		throw Error(`No Response to ${what}`);
	}
	const engineId = readText(data.engineId);
	const personId = readText(data.person.id);
	if (!engineId || !personId) {
		throw Error(
			`Unexpected Response to ${what}: it names no model or person`,
		);
	}
	const billedLimitType =
		typeof data.billedLimitType === "string" &&
		BILLED_LIMIT_TYPES.includes(data.billedLimitType)
			? (data.billedLimitType as UsageBilledLimitType)
			: null;
	return {
		engineId,
		person: { id: personId, type: readText(data.person.type) },
		billedLimitType,
		ceilings: readOptionalList(data.ceilings).flatMap(
			(step) => readPathStep(step) ?? [],
		),
		steps: readOptionalList(data.steps).flatMap(
			(step) => readPathStep(step) ?? [],
		),
	};
};

/**
 * Read how usage limits apply to one person on a model, step by step: the
 * ceilings every call needs room in, then each source in the order it is
 * tried, with what is used of each rule and when it resets. The model's editors
 * and owners only, or admins in admin mode.
 * @param engineId - The model
 * @param person - The person, by their user id and login type
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The path
 * @throws When the response is not a path
 */
export const getUsageLimitPath = async (
	engineId: string,
	person: { id: string; type: string },
	admin = false,
): Promise<UsageLimitPath> => {
	const params = new URLSearchParams({
		engineId,
		userId: person.id,
		userType: person.type,
	});
	const response = await get<unknown>(
		`${permissionBatchUrl(admin)}/getUsageLimitPath?${params.toString()}`,
	);
	return readUsageLimitPath(response?.data, "read how the limits apply");
};

/**
 * Read how usage limits apply to the signed in person on a model, step by
 * step, with what is used of each rule and when it resets. Anyone who can use
 * the model.
 * @param engineId - The model
 * @returns The path
 * @throws When the response is not a path
 */
export const getMyUsageLimitPath = async (
	engineId: string,
): Promise<UsageLimitPath> => {
	const params = new URLSearchParams({ engineId });
	const response = await get<unknown>(
		`${permissionBatchUrl(false)}/getMyUsageLimitPath?${params.toString()}`,
	);
	return readUsageLimitPath(response?.data, "read your limit on this model");
};

/** A model the signed in person can use, with how usage limits apply to them on it */
export interface MyModelUsagePath {
	/** The model */
	engineId: string;
	/** Its name */
	name: string;
	/** Its subtype, such as OPEN_AI or EMBEDDED, or null */
	subtype: string | null;
	/** How usage limits apply to the person on it */
	path: UsageLimitPath;
}

/**
 * Read how usage limits apply to the signed in person on every model they can
 * use, for a dashboard of their use. A model whose path cannot be read is left
 * out, so it does not hide the others.
 * @returns The models, each with its path
 * @throws When the response has no list of models
 */
export const getMyUsageLimitPaths = async (): Promise<MyModelUsagePath[]> => {
	const response = await get<unknown>(
		`${permissionBatchUrl(false)}/getMyUsageLimitPaths`,
	);
	const data = response?.data;
	if (!isObject(data) || !Array.isArray(data.models)) {
		throw Error("No Response to read your limits on your models");
	}
	const models: MyModelUsagePath[] = [];
	for (const model of data.models) {
		const engineId = isObject(model) ? readText(model.engineId) : null;
		if (!isObject(model) || !engineId) {
			continue;
		}
		try {
			models.push({
				engineId,
				name: readText(model.name) ?? engineId,
				subtype: readText(model.subtype),
				path: readUsageLimitPath(
					model.path,
					"read your limits on your models",
				),
			});
		} catch {
			// a model whose path cannot be read is left out
		}
	}
	return models;
};
