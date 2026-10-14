import { useMemo, useRef } from "react";
import { searchForUser } from "@semoss/sdk";
import type { MembersSource, MemberUser } from "@semoss/shared";
import { getErrorMessage } from "@semoss/utility/error";
import {
	addGroupManager,
	type GroupManager,
	getGroupManagers,
	removeGroupManager,
} from "@/api/teams";

/** A manager in the shape the shared members table shows */
const toMemberUser = (manager: GroupManager): MemberUser => ({
	id: manager.userid,
	name: manager.name || manager.email || manager.userid,
	type: manager.type,
	email: manager.email ?? "",
	permission: "",
	permission_granted_by: "",
	permission_granted_by_type: "",
	date_added: manager.dateadded ?? "",
});

/** The key a manager is matched on: a login's type and id */
const getManagerKey = (type: string, userId: string): string =>
	`${type}:${userId}`;

/**
 * The source the shared members table reads a custom team's managers from:
 * list and remove them, and add people from existing users or the
 * organization's directory. Current managers are listed in the add dialog but
 * cannot be picked again. Admins and the team's managers add and remove managers.
 *
 * @param groupId - the custom team, or null for a team that has no managers
 * @param admin - whether to use the admin endpoints; a team's managers use the other
 * @returns the source, stable while the team and endpoints stay the same
 */
export const useGroupManagersSource = (
	groupId: string | null,
	admin: boolean,
): MembersSource => {
	// every load reads all the managers, so it keeps who they are for the add dialog
	const managerKeysRef = useRef<Set<string>>(new Set());

	return useMemo<MembersSource>(
		() => ({
			memberLabel: "Manager",
			addLabel: "Add Manager",
			load: async (searchTerm, limit, offset) => {
				if (!groupId) {
					managerKeysRef.current = new Set();
					return { members: [], total: 0 };
				}
				// a team has few managers, so they are read at once and searched here
				const managers = await getGroupManagers(groupId, admin);
				managerKeysRef.current = new Set(
					managers.map((manager) =>
						getManagerKey(manager.type, manager.userid),
					),
				);
				const term = searchTerm.trim().toLowerCase();
				const matches = managers.filter(
					(manager) =>
						!term ||
						[manager.name, manager.email, manager.userid].some(
							(value) => value?.toLowerCase().includes(term),
						),
				);
				return {
					members: matches
						.slice(offset, offset + limit)
						.map(toMemberUser),
					total: matches.length,
				};
			},
			remove: async (members) => {
				if (!groupId) {
					return;
				}
				const failures: string[] = [];
				for (const member of members) {
					try {
						await removeGroupManager(
							groupId,
							member.type,
							member.id,
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
				title: "Add Manager",
				description: "Managers add and remove this team's members.",
				successMessage: "Managers added",
				load: async (searchTerm, limit, offset, msGraphLookup) =>
					(
						await searchForUser(searchTerm, {
							limit,
							offset,
							// without the directory, search existing users
							msGraphLookup: msGraphLookup ?? false,
						})
					).flatMap((person) =>
						person.type
							? [
									{
										id: person.id,
										type: person.type,
										name: person.name,
										email: person.email,
										username: person.username,
									},
								]
							: [],
					),
				getUnavailableReason: (person) =>
					managerKeysRef.current.has(
						getManagerKey(person.type, person.id),
					)
						? "Already a Manager"
						: null,
				add: async (people) => {
					if (!groupId) {
						return;
					}
					const failures: string[] = [];
					for (const person of people) {
						try {
							await addGroupManager(
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
};
