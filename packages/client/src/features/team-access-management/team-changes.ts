import type {
	AccessPerson,
	PermissionBatch,
	PermissionChange,
	PermissionTargetResourceKind,
	TeamRole,
} from "@semoss/sdk";
import type { ReviewItem } from "@/features/bulk-access-management/permission-batch-review-dialog";

/** The changes staged for one of a team's lists: its members or its managers */
export interface TeamPeopleEdits {
	/** People to add, by key */
	adds: ReadonlyMap<string, AccessPerson>;
	/** Keys of people to remove */
	removals: ReadonlySet<string>;
}

/** The changes staged for a custom team, to its members and to its managers */
export type TeamEdits = Readonly<Record<TeamRole, TeamPeopleEdits>>;

/** The team's people now, in each list */
export type TeamPeopleByRole = Readonly<Record<TeamRole, AccessPerson[]>>;

/** A list with nothing staged */
export const NO_PEOPLE_EDITS: TeamPeopleEdits = {
	adds: new Map(),
	removals: new Set(),
};

/** A team with nothing staged */
export const NO_TEAM_EDITS: TeamEdits = {
	MEMBERS: NO_PEOPLE_EDITS,
	MANAGERS: NO_PEOPLE_EDITS,
};

/** The lists, in the order a team's Bulk Access Management and the review show them */
export const TEAM_ROLES: readonly TeamRole[] = ["MEMBERS", "MANAGERS"];

/** The permission batch target that changes each list */
const TARGET_KINDS: Record<TeamRole, PermissionTargetResourceKind> = {
	MEMBERS: "TEAM",
	MANAGERS: "TEAM_MANAGERS",
};

/**
 * The key of a team's member or manager. A team keeps each person's login, so
 * two people with the same id on different logins are different people.
 *
 * @param person - a person
 * @returns the key
 */
export const getTeamPersonKey = (person: AccessPerson): string =>
	`USER:${person.type}:${person.id}`;

/**
 * @param person - a person
 * @returns the text they are shown by
 */
export const getPersonName = (person: AccessPerson): string =>
	person.name || person.email || person.id;

/**
 * @param edits - the staged changes to one list
 * @returns how many changes they make
 */
export const countPeopleChanges = (edits: TeamPeopleEdits): number =>
	edits.adds.size + edits.removals.size;

/**
 * @param edits - the staged changes
 * @returns how many changes they make, to both lists
 */
export const countTeamChanges = (edits: TeamEdits): number =>
	TEAM_ROLES.reduce(
		(count, role) => count + countPeopleChanges(edits[role]),
		0,
	);

/** The permission batches to save, and how the review lists their changes */
export interface TeamBatches {
	/** A batch for each list that changes, members first */
	batches: PermissionBatch[];
	/** The list each batch changes, in the same order */
	roles: TeamRole[];
	/** Every change, as the review lists it; the key is the person's key */
	items: ReviewItem[];
}

/**
 * Turns a team's staged changes into the permission batches to save: one for
 * its members and one for its managers, each only when it changes.
 *
 * @param groupId - the custom team
 * @param edits - the staged changes
 * @param current - the team's members and managers now
 * @returns the batches, the list each changes, and the review's items
 */
export const buildTeamBatches = (
	groupId: string,
	edits: TeamEdits,
	current: TeamPeopleByRole,
): TeamBatches => {
	const result: TeamBatches = { batches: [], roles: [], items: [] };
	for (const role of TEAM_ROLES) {
		const changes: {
			key: string;
			change: PermissionChange;
			person: AccessPerson;
		}[] = [];
		for (const [key, person] of edits[role].adds) {
			changes.push({
				key,
				change: {
					action: "ADD",
					subject: { kind: "USER", id: person.id, type: person.type },
				},
				person,
			});
		}
		// a staged removal of someone no longer in the list is left out
		for (const person of current[role]) {
			const key = getTeamPersonKey(person);
			if (edits[role].removals.has(key)) {
				changes.push({
					key,
					change: {
						action: "REMOVE",
						subject: {
							kind: "USER",
							id: person.id,
							type: person.type,
						},
					},
					person,
				});
			}
		}
		if (changes.length === 0) {
			continue;
		}
		const batchIndex = result.batches.length;
		// it reads in the middle of the review's sentences too
		const where =
			role === "MANAGERS"
				? `${groupId} team managers`
				: `${groupId} team members`;
		result.batches.push({
			target: { kind: TARGET_KINDS[role], id: groupId },
			changes: changes.map((item) => item.change),
		});
		result.roles.push(role);
		result.items.push(
			...changes.map((item, changeIndex) => ({
				batchIndex,
				changeIndex,
				key: item.key,
				where,
				action: item.change.action,
				name: getPersonName(item.person),
				kind: "USER" as const,
				type: item.person.type,
				id: item.person.id,
				email: item.person.email,
				// the Added and Removed pills say it all for a member or manager
				detail: "",
			})),
		);
	}
	return result;
};

/**
 * Drops the staged changes the team's lists already show, after they are read
 * again: adds of people now in a list and removals of people no longer in it
 *
 * @param edits - the staged changes
 * @param current - the team's members and managers as just read
 * @returns the changes still to make
 */
export const withoutSettledChanges = (
	edits: TeamEdits,
	current: TeamPeopleByRole,
): TeamEdits => {
	const next: Record<TeamRole, TeamPeopleEdits> = { ...edits };
	for (const role of TEAM_ROLES) {
		const keys = new Set(current[role].map(getTeamPersonKey));
		next[role] = {
			adds: new Map(
				[...edits[role].adds].filter(([key]) => !keys.has(key)),
			),
			removals: new Set(
				[...edits[role].removals].filter((key) => keys.has(key)),
			),
		};
	}
	return next;
};

/**
 * Drops staged changes to one list, such as the blocked ones
 *
 * @param edits - the staged changes to the list
 * @param keys - the people's keys
 * @returns the changes without them
 */
export const withoutPeople = (
	edits: TeamPeopleEdits,
	keys: Iterable<string>,
): TeamPeopleEdits => {
	const adds = new Map(edits.adds);
	const removals = new Set(edits.removals);
	for (const key of keys) {
		adds.delete(key);
		removals.delete(key);
	}
	return { adds, removals };
};
