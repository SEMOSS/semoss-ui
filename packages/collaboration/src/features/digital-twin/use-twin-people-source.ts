import { useEffect, useMemo, useRef } from "react";
import {
	addProjectUserPermissions,
	getProjectUsers,
	getProjectUsersNoCredentials,
	type PostUser,
	removeProjectUserPermissions,
} from "@semoss/sdk";
import type { AddMembersCandidate, MembersSource } from "@semoss/shared";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";

// the one level a twin is shared at: people chat with it and read what it knows, and change nothing
const ACCESS = "READ_ONLY";

interface TwinPeopleOptions {
	/**
	 * The day the people added from now on keep access until, as a date input
	 * gives it (`2026-12-31`), counted to the end of that day where the owner
	 * is. Empty for access with no end.
	 */
	accessEnds?: string;
	/** Told who was just given access, so the page can offer to tell them. */
	onAdded?: (people: AddMembersCandidate[]) => void;
}

/**
 * When access ends, as the list words it.
 *
 * @param value - The end the server keeps, in UTC, with or without saying so.
 * @returns Such as "Until Dec 31, 2026"; undefined for access with no end, or
 * a value that is not a time.
 */
export function accessEndLabel(value: unknown): string | undefined {
	if (typeof value !== "string" || !value.trim()) return undefined;
	const end = parseTimestampWithUtcDefault(value.trim());
	return end.isValid()
		? `Until ${end.toDate().toLocaleDateString(undefined, { dateStyle: "medium" })}`
		: undefined;
}

/**
 * The end of the day the owner picked, as the server takes it.
 *
 * @param day - A date input's value; empty for no end.
 * @returns An ISO date and time in UTC, or undefined for no end.
 * @throws when the day cannot be read or is over, so access is never given
 * without the end its owner asked for.
 */
export function accessEndOf(day: string): string | undefined {
	if (!day) return undefined;
	const end = new Date(`${day}T23:59:59`);
	if (Number.isNaN(end.getTime()))
		throw new Error("Choose the day access ends again.");
	if (end.getTime() < Date.now())
		throw new Error("The day access ends has already passed.");
	return end.toISOString();
}

/**
 * The source the shared members table reads a twin's people from: the people
 * the owner named, who can chat with it. Only read-only access is listed,
 * given and taken away, so the owner (and anyone made an editor elsewhere) is
 * never in the list and cannot be removed from it.
 *
 * @param twinId - The owner's twin.
 * @param options - When the access given from now on ends, and who to tell of an add.
 * @returns The source, stable while the twin stays the same.
 */
export function useTwinPeopleSource(
	twinId: string,
	{ accessEnds = "", onAdded }: TwinPeopleOptions = {},
): MembersSource {
	// read when people are added: a new end day must not reload the list
	const latest = useRef({ accessEnds, onAdded });
	useEffect(() => {
		latest.current = { accessEnds, onAdded };
	}, [accessEnds, onAdded]);
	return useMemo<MembersSource>(
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
						// the server sends it with each person; the user type leaves it out
						access_ends: accessEndLabel(
							"end_date" in member ? member.end_date : undefined,
						),
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
					"They can chat with your Digital Twin, open the copies it holds and read its instructions.",
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
					const endDate = accessEndOf(latest.current.accessEnds);
					const users = people.map(
						(person): PostUser => ({
							userid: person.id,
							type: person.type,
							name: person.name,
							email: person.email,
							username: person.username,
							permission: ACCESS,
						}),
					);
					const isAdded = endDate
						? await addProjectUserPermissions(
								twinId,
								users,
								false,
								endDate,
							)
						: await addProjectUserPermissions(twinId, users, false);
					if (!isAdded)
						throw new Error("Could not add these people.");
					latest.current.onAdded?.(people);
				},
			},
		}),
		[twinId],
	);
}
