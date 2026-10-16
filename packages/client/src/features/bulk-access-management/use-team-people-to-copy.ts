import { useEffect, useState } from "react";
import {
	getPermissionsToCopy,
	type PermissionsToCopy,
	type PermissionTargetResource,
	type TeamRole,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

/** Where a team's list stands: being read, read, the list being changed, or not readable */
export type CopySourceStatus = "LOADING" | "READY" | "SAME_LIST" | "ERROR";

/** One of a team's lists, as a source of people to copy */
export interface CopySource {
	/** Which of the team's lists */
	role: TeamRole;
	/** Where the list stands */
	status: CopySourceStatus;
	/** Everyone in it, once read */
	rows: PermissionsToCopy[];
	/**
	 * Those of them who would be brought in: on a team, the ones not yet in the
	 * list being changed; on a project or engine, all of them, since one who
	 * already has access can be given a different level, which the batch shows
	 * as a conflict
	 */
	newRows: PermissionsToCopy[];
	/** Why it could not be read, or null */
	error: string | null;
}

/**
 * @param source - one of a team's lists
 * @returns whether copying from it would bring anyone in
 */
export const canCopyFrom = (source: CopySource): boolean =>
	source.status === "READY" && source.newRows.length > 0;

/**
 * @param role - members or managers
 * @returns the source resource type that reads that list of a team
 */
const toSourceResourceType = (role: TeamRole): "TEAM" | "TEAM_MANAGERS" =>
	role === "MANAGERS" ? "TEAM_MANAGERS" : "TEAM";

/**
 * Reads the lists of a custom team that can be copied into a target, again
 * whenever the team changes, so a picker can say how many people each holds
 * and how many are new before anything is copied. The list being changed, such
 * as this team's managers when its managers are the target, is not read. A
 * read a newer one replaced is dropped.
 *
 * @param team - the team to copy from, or empty to read nothing
 * @param target - the project, engine, or team's members or managers being changed
 * @param roles - which of the team's lists to read
 * @param admin - whether to read them in admin mode
 * @returns each list in the order asked for, or none while no team is chosen
 */
export const useTeamPeopleToCopy = (
	team: string,
	target: PermissionTargetResource,
	roles: readonly TeamRole[],
	admin: boolean,
): CopySource[] => {
	const [sources, setSources] = useState<CopySource[]>([]);
	const { resourceType: targetResourceType, id: targetId } = target;
	const rolesKey = roles.join(",");

	useEffect(() => {
		if (!team) {
			setSources([]);
			return;
		}
		let isStale = false;
		const asked = rolesKey
			.split(",")
			.filter(
				(role): role is TeamRole =>
					role === "MEMBERS" || role === "MANAGERS",
			);
		const isTeamTarget =
			targetResourceType === "TEAM" ||
			targetResourceType === "TEAM_MANAGERS";
		const isSameList = (role: TeamRole) =>
			team === targetId &&
			toSourceResourceType(role) === targetResourceType;
		setSources(
			asked.map((role) => ({
				role,
				status: isSameList(role) ? "SAME_LIST" : "LOADING",
				rows: [],
				newRows: [],
				error: null,
			})),
		);
		for (const role of asked) {
			if (isSameList(role)) {
				continue;
			}
			getPermissionsToCopy(
				{ resourceType: toSourceResourceType(role), id: team },
				{ resourceType: targetResourceType, id: targetId },
				admin,
			)
				.then((rows) => {
					if (!isStale) {
						const ready: CopySource = {
							role,
							status: "READY",
							rows,
							newRows: isTeamTarget
								? rows.filter((row) => !row.inTarget)
								: rows,
							error: null,
						};
						setSources((current) =>
							current.map((source) =>
								source.role === role ? ready : source,
							),
						);
					}
				})
				.catch((e: unknown) => {
					if (!isStale) {
						const failed: CopySource = {
							role,
							status: "ERROR",
							rows: [],
							newRows: [],
							error: getErrorMessage(
								e,
								role === "MANAGERS"
									? "Could not read the team's managers"
									: "Could not read the team's members",
							),
						};
						setSources((current) =>
							current.map((source) =>
								source.role === role ? failed : source,
							),
						);
					}
				});
		}
		return () => {
			isStale = true;
		};
	}, [team, targetResourceType, targetId, rolesKey, admin]);

	return sources;
};
