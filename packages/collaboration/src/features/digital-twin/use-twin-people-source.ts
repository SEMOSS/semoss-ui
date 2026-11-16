import { useMemo } from "react";
import {
	addProjectUserPermissions,
	getProjectUsers,
	getProjectUsersNoCredentials,
	removeProjectUserPermissions,
} from "@semoss/sdk";
import type { MembersSource } from "@semoss/shared";

// the one level a twin is shared at: people chat with it and read what it knows, and change nothing
const ACCESS = "READ_ONLY";

/**
 * The source the shared members table reads a twin's people from: the people
 * the owner named, who can chat with it. Only read-only access is listed,
 * given and taken away, so the owner (and anyone made an editor elsewhere) is
 * never in the list and cannot be removed from it.
 *
 * @param twinId - The owner's twin.
 * @returns The source, stable while the twin stays the same.
 */
export const useTwinPeopleSource = (twinId: string): MembersSource =>
	useMemo<MembersSource>(
		() => ({
			memberLabel: "Person",
			addLabel: "Add People",
			load: async (searchTerm, limit, offset) => {
				const { members, totalMembers } = await getProjectUsers(
					twinId,
					false,
					searchTerm || undefined,
					ACCESS,
					limit,
					offset,
				);
				return {
					members: (members ?? []).map((member) => ({
						id: member.id,
						name: member.name || member.email || member.id,
						type: member.type ?? "",
						email: member.email ?? "",
						permission: "",
						permission_granted_by: "",
						permission_granted_by_type: "",
						date_added: member.date_added ?? "",
					})),
					total: Number(totalMembers) || 0,
				};
			},
			remove: async (members) => {
				const isRemoved = await removeProjectUserPermissions(
					twinId,
					members.map((member) => member.id),
					false,
				);
				if (!isRemoved) throw new Error("Could not remove access.");
			},
			people: {
				title: "Add People",
				description:
					"They can chat with your Digital Twin, open the copies it holds, read its instructions and see who else it is shared with.",
				successMessage: "People added",
				load: async (searchTerm, limit, offset, msGraphLookup) =>
					(
						await getProjectUsersNoCredentials(
							twinId,
							false,
							searchTerm || undefined,
							limit,
							offset,
							msGraphLookup,
						)
					).map((user) => ({
						id: user.id,
						type: user.type ?? "",
						name: user.name ?? null,
						email: user.email ?? null,
						// present on a directory result, which the user type leaves out
						username:
							"username" in user &&
							typeof user.username === "string"
								? user.username
								: null,
					})),
				add: async (people) => {
					const isAdded = await addProjectUserPermissions(
						twinId,
						people.map((person) => ({
							userid: person.id,
							type: person.type,
							name: person.name,
							email: person.email,
							username: person.username,
							permission: ACCESS,
						})),
						false,
					);
					if (!isAdded)
						throw new Error("Could not add these people.");
				},
			},
		}),
		[twinId],
	);
