import { useMemo } from "react";
import type { MembersSource, MemberUser } from "@semoss/shared";
import { getErrorMessage } from "@semoss/utility/error";
import {
	addTeamUser,
	deleteTeamUser,
	getNonTeamUsers,
	getTeamUsers,
	getTeamUsersCount,
	type TeamMember,
	toTeamMembers,
} from "@/api/teams";

/** A team member in the shape the shared members table shows */
const toMemberUser = (member: TeamMember): MemberUser => ({
	id: member.userId,
	name: member.name || member.email || member.userId,
	type: member.type,
	email: member.email ?? "",
	permission: "",
	permission_granted_by: "",
	permission_granted_by_type: "",
	date_added: member.dateAdded ?? "",
});

/**
 * The source the shared members table reads a custom team's members from:
 * list and remove them, and add people from existing users or the
 * organization's directory.
 *
 * @param groupId - the custom team
 * @param admin - whether to use the admin endpoints; a team's managers use the others
 * @returns the source, stable while the team and endpoints stay the same
 */
export const useTeamMembersSource = (
	groupId: string,
	admin: boolean,
): MembersSource =>
	useMemo<MembersSource>(
		() => ({
			load: async (searchTerm, limit, offset) => {
				const [rows, total] = await Promise.all([
					getTeamUsers(groupId, limit, offset, searchTerm, admin),
					getTeamUsersCount(groupId, searchTerm || undefined, admin),
				]);
				return {
					members: toTeamMembers(rows).map(toMemberUser),
					total: Number(total) || 0,
				};
			},
			remove: async (members) => {
				const failures: string[] = [];
				for (const member of members) {
					try {
						await deleteTeamUser(
							{
								groupid: groupId,
								type: member.type,
								userid: member.id,
							},
							admin,
						);
					} catch (e) {
						failures.push(
							`${member.name}: ${getErrorMessage(e, "not removed")}`,
						);
					}
				}
				if (failures.length > 0) {
					throw new Error(failures.join(" "));
				}
			},
			people: {
				successMessage: "Members added",
				load: async (searchTerm, limit, offset, msGraphLookup) =>
					toTeamMembers(
						await getNonTeamUsers(
							groupId,
							limit,
							offset,
							searchTerm,
							msGraphLookup,
							admin,
						),
					).map((member) => ({
						id: member.userId,
						type: member.type,
						name: member.name,
						email: member.email,
						username: member.username,
					})),
				add: async (people) => {
					const failures: string[] = [];
					for (const person of people) {
						try {
							await addTeamUser(
								groupId,
								person.type,
								person.id,
								admin,
							);
						} catch (e) {
							failures.push(
								`${person.name || person.email || person.id}: ${getErrorMessage(e, "not added")}`,
							);
						}
					}
					if (failures.length > 0) {
						throw new Error(failures.join(" "));
					}
				},
			},
		}),
		[groupId, admin],
	);
