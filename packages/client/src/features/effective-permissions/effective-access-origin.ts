import type { EffectivePermissionRow } from "@semoss/sdk";

/** Where a person's access comes from, as the view filters it */
export type AccessOrigin = "DIRECT" | "TEAMS" | "BOTH";

/**
 * @param row - a person's effective access
 * @returns whether they get it directly, only through teams, or both ways
 */
export const getAccessOrigin = (row: EffectivePermissionRow): AccessOrigin => {
	const isDirect = row.sources.some(
		(source) => source.sourceType === "DIRECT",
	);
	const isThroughTeam = row.sources.some(
		(source) => source.sourceType === "TEAM",
	);
	if (isDirect && isThroughTeam) {
		return "BOTH";
	}
	return isDirect ? "DIRECT" : "TEAMS";
};

/**
 * Whether a person matches a search of their name, email or id, or of a team
 * their access comes through
 *
 * @param row - a person's effective access
 * @param search - the search, in lower case, or empty for everyone
 * @returns whether they match
 */
export const matchesEffectiveSearch = (
	row: EffectivePermissionRow,
	search: string,
): boolean =>
	!search ||
	[
		row.subject.id,
		row.subject.name,
		row.subject.email,
		...row.sources.map((source) =>
			source.sourceType === "TEAM" ? source.id : null,
		),
	]
		.filter((value): value is string => typeof value === "string")
		.some((value) => value.toLowerCase().includes(search));
