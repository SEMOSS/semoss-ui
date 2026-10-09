import type { Role } from "@semoss/sdk";

/** An access level a team can have to a project or engine */
export interface GroupAccessLevel {
	/** The permission the owner endpoints take */
	value: Role;
	/** The number a team's access row carries */
	id: number;
	/** What the access pages call it */
	label: string;
}

/** The level a team starts with when it is given access */
export const DEFAULT_GROUP_ACCESS_LEVEL: GroupAccessLevel = {
	value: "READ_ONLY",
	id: 3,
	label: "Read-Only",
};

/** The levels a team can be given, from least to most access */
export const GROUP_ACCESS_LEVELS: GroupAccessLevel[] = [
	DEFAULT_GROUP_ACCESS_LEVEL,
	{ value: "EDIT", id: 2, label: "Editor" },
	{ value: "OWNER", id: 1, label: "Author" },
];

/**
 * Finds the level for the permission number a team's access row carries
 *
 * @param permission - the row's permission, as a number or numeric string
 * @returns the level, or undefined for an unknown permission
 */
export const getGroupAccessLevel = (
	permission: unknown,
): GroupAccessLevel | undefined =>
	GROUP_ACCESS_LEVELS.find(
		(level) => String(level.id) === String(permission),
	);
