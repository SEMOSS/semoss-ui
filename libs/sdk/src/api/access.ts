import { Env } from "../env";
import { get, post } from "../utility";

/**
 * What a permission batch changes: a project, an engine, an insight, a custom
 * team's members (TEAM) or a custom team's managers (TEAM_MANAGERS)
 */
export type PermissionTargetResourceKind =
	| "PROJECT"
	| "ENGINE"
	| "INSIGHT"
	| "TEAM"
	| "TEAM_MANAGERS";

/** A project, engine or insight, or a custom team's members or managers */
export interface PermissionTargetResource {
	/** What it is */
	kind: PermissionTargetResourceKind;
	/** Its id; for a team, the team name */
	id: string;
	/** The project an insight belongs to */
	projectId?: string;
}

/** Who a change is for */
export interface PermissionSubject {
	/** A person, or a team on a project, engine or insight */
	kind: "USER" | "TEAM";
	/** The user id or team name */
	id: string;
	/** The person's login type, or the team's type such as CUSTOM */
	type: string;
}

/** A person, with the details Bulk Access Management shows */
export interface AccessPerson extends PermissionSubject {
	/** Always a person */
	kind: "USER";
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
	/** A model engine's usage restriction, such as TOKENS */
	usageRestriction?: string | null;
	/** How often a model engine's limits reset, such as DAILY */
	usageFrequency?: string | null;
	/** A model engine's token limit */
	maxTokens?: number | null;
	/** A model engine's response time limit */
	maxResponseTime?: number | null;
}

/** One change in a permission batch */
export interface PermissionChange {
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
}

/** Who can use a project or engine now */
export interface ResourcePermissions {
	/** The people given access directly */
	people: CurrentAccess<AccessPerson>[];
	/** The teams that have access */
	teams: CurrentAccess[];
	/** What the signed in user may change */
	allowedPermissionChanges: PermissionAllowedChanges;
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
			kind: "DIRECT";
			/** The access */
			level: AccessLevel;
			/** When it ends, or null */
			endDate: string | null;
	  }
	| {
			/** Through a custom team they are in */
			kind: "TEAM";
			/** The team's name */
			id: string;
			/** The team's type */
			type: string;
			/** The access the team gives */
			level: AccessLevel;
			/** When the team's access ends, or null */
			endDate: string | null;
	  };

/** A person who can use a project or engine, and where their access comes from */
export interface EffectivePermissionRow {
	/** The person */
	subject: AccessPerson;
	/** The most access any source gives them */
	level: AccessLevel;
	/** Every source of their access, the most access first */
	sources: PermissionSource[];
}

/** Everyone who can use a project or engine in the end */
export interface EffectivePermissions {
	/** One row per person */
	people: EffectivePermissionRow[];
	/** Teams whose members come from a login provider, so they are not listed */
	unlistedTeams: { id: string; type: string; level: AccessLevel }[];
}

/**
 * @param admin - Whether to use admin mode, where an admin can change and read
 * anything; outside it an admin has only their own permissions
 * @returns the base URL of the permission batch calls
 */
const PERMISSION_BATCH_URL = (admin: boolean) =>
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

const TARGET_KINDS: readonly string[] = [
	"PROJECT",
	"ENGINE",
	"INSIGHT",
	"TEAM",
	"TEAM_MANAGERS",
];

/** Reads a target kind, or null */
const readTargetKind = (value: unknown): PermissionTargetResourceKind | null =>
	typeof value === "string" && TARGET_KINDS.includes(value)
		? (value as PermissionTargetResourceKind)
		: null;

/** Reads an access level, or null */
const readLevel = (value: unknown): AccessLevel | null =>
	typeof value === "string" && LEVELS.includes(value)
		? (value as AccessLevel)
		: null;

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
		usageRestriction: readText(value.usageRestriction),
		usageFrequency: readText(value.usageFrequency),
		maxTokens: readNumber(value.maxTokens),
		maxResponseTime: readNumber(value.maxResponseTime),
	};
};

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
		kind: "USER",
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
 * and times in UTC, so a batch can send them back as they are.
 * @param target - The project or engine
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people, the teams and the changes the user may make. Rows without a known
 * level, id or type are left out.
 */
export const getResourcePermissions = async (
	target: PermissionTargetResource,
	admin = false,
): Promise<ResourcePermissions> => {
	const params = new URLSearchParams({ kind: target.kind, id: target.id });
	const response = await get<unknown>(
		`${PERMISSION_BATCH_URL(admin)}/getPermissions?${params.toString()}`,
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
				? [{ subject: { kind: "TEAM" as const, id, type }, access }]
				: [];
		}),
		allowedPermissionChanges: {
			canChangePeople: allowed.canChangePeople === true,
			canGiveAuthorAccess: allowed.canGiveAuthorAccess === true,
			canChangeTeams: allowed.canChangeTeams === true,
			addsAreAdminOnly: allowed.addsAreAdminOnly === true,
		},
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
		kind: role === "MANAGERS" ? "TEAM_MANAGERS" : "TEAM",
		id: groupId,
	});
	const response = await get<unknown>(
		`${PERMISSION_BATCH_URL(admin)}/getPermissions?${params.toString()}`,
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
 * Validate permission batches without saving them. Each change is checked
 * against the same rules as the single permission calls, and against the
 * current access, so a change someone already made or undid is reported.
 * @param batches - The batches; a target can be in only one
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns What validating each batch found, in order
 */
export const validatePermissionBatches = async (
	batches: PermissionBatch[],
	admin = false,
): Promise<PermissionBatchValidation[]> => {
	const response = await post<unknown>(
		`${PERMISSION_BATCH_URL(admin)}/validatePermissionBatches`,
		{ batches },
		{},
	);
	return readList(response?.data, "validate the permission batch").flatMap(
		(row) => {
			if (!isObject(row) || !isObject(row.target)) {
				return [];
			}
			const kind = readTargetKind(row.target.kind);
			const id = readText(row.target.id);
			if (!kind || !id) {
				return [];
			}
			const projectId = readText(row.target.projectId);
			return [
				{
					target: { kind, id, ...(projectId ? { projectId } : {}) },
					reason: readText(row.reason),
					changes: readList(
						row.changes,
						"validate the permission batch",
					)
						.filter(isObject)
						.map((change) => ({
							index: readNumber(change.index) ?? -1,
							allowed: change.allowed === true,
							reason: readText(change.reason),
						})),
				},
			];
		},
	);
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
		`${PERMISSION_BATCH_URL(admin)}/savePermissionBatches`,
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
		sourceKind: source.kind,
		sourceId: source.id,
		targetKind: target.kind,
		targetId: target.id,
	});
	const response = await get<unknown>(
		`${PERMISSION_BATCH_URL(admin)}/getPermissionsToCopy?${params.toString()}`,
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
	if (value.kind === "DIRECT") {
		return { kind: "DIRECT", level, endDate };
	}
	const id = readText(value.id);
	const type = readText(value.type);
	return value.kind === "TEAM" && id && type
		? { kind: "TEAM", id, type, level, endDate }
		: null;
};

/**
 * Read everyone who can use a project or engine in the end, one row per person,
 * with the access they get directly and through each custom team they are in.
 * Its editors and owners only, or admins in admin mode, since the rows show who
 * is in its teams.
 * @param target - The project or engine
 * @param admin - Whether to use admin mode; outside it an admin has only their own permissions
 * @returns The people, and the teams whose members come from a login provider.
 * Rows without an id, login type, known level or source are left out.
 */
export const getEffectivePermissions = async (
	target: PermissionTargetResource,
	admin = false,
): Promise<EffectivePermissions> => {
	const params = new URLSearchParams({ kind: target.kind, id: target.id });
	const response = await get<unknown>(
		`${PERMISSION_BATCH_URL(admin)}/getEffectivePermissions?${params.toString()}`,
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
				const sources = (
					Array.isArray(row.sources) ? (row.sources as unknown[]) : []
				).flatMap((source) => readSource(source) ?? []);
				return subject && level && sources.length > 0
					? [{ subject, level, sources }]
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
			return id && type && level ? [{ id, type, level }] : [];
		}),
	};
};
