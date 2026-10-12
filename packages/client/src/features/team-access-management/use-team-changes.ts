import { useCallback, useEffect, useState } from "react";
import { type AccessPerson, getTeamPeople, type TeamRole } from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import {
	countTeamChanges,
	getTeamPersonKey,
	NO_TEAM_EDITS,
	type TeamEdits,
	type TeamPeopleByRole,
	withoutPeople,
	withoutSettledChanges,
} from "./team-changes";

/** No one, before the team is read */
const NO_PEOPLE: TeamPeopleByRole = { MEMBERS: [], MANAGERS: [] };

/** Nothing can be changed, before the team is read */
const NO_CHANGES_ALLOWED: Readonly<Record<TeamRole, boolean>> = {
	MEMBERS: false,
	MANAGERS: false,
};

export interface UseTeamChangesResult {
	/** The team's members and managers now */
	people: TeamPeopleByRole;
	/** Whether the signed in user can change each list */
	canChange: Readonly<Record<TeamRole, boolean>>;
	/** Whether the team is being read */
	isLoading: boolean;
	/** Whether the team has been read at least once */
	hasLoaded: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** The staged changes */
	edits: TeamEdits;
	/** How many changes are staged, to both lists */
	changeCount: number;
	/**
	 * Adds people who are not in the list yet, and undoes the staged removal of
	 * anyone in it; returns how many changed
	 */
	addPeople: (role: TeamRole, people: AccessPerson[]) => number;
	/** Stages removing someone from the list */
	removePerson: (role: TeamRole, person: AccessPerson) => void;
	/** Drops the staged changes to the list for these people */
	undoPeople: (role: TeamRole, keys: string[]) => void;
	/** Drops every staged change */
	discard: () => void;
	/** Reads the team again and keeps the staged changes */
	refresh: () => void;
	/**
	 * Drops the changes after they were saved and reads the team again; nothing is
	 * listed until it is read, so the lists from before the save never show
	 */
	finishApply: () => void;
}

/**
 * The state of a custom team's Bulk Access Management: its members and
 * managers, and the changes staged to each. Nothing is saved here; the review dialog
 * saves the changes.
 *
 * @param groupId - the custom team
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns the team, the staged changes and the ways to change them
 */
export const useTeamChanges = (
	groupId: string,
	admin = false,
): UseTeamChangesResult => {
	const [people, setPeople] = useState<TeamPeopleByRole>(NO_PEOPLE);
	const [canChange, setCanChange] =
		useState<Readonly<Record<TeamRole, boolean>>>(NO_CHANGES_ALLOWED);
	const [isLoading, setIsLoading] = useState(true);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [edits, setEdits] = useState<TeamEdits>(NO_TEAM_EDITS);
	const [refreshCount, setRefreshCount] = useState(0);

	useEffect(() => {
		// refreshCount is read so a refresh reads the team again
		if (!groupId || refreshCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		Promise.all([
			getTeamPeople(groupId, "MEMBERS", admin),
			getTeamPeople(groupId, "MANAGERS", admin),
		])
			.then(([members, managers]) => {
				if (!isStale) {
					const next: TeamPeopleByRole = {
						MEMBERS: members.people,
						MANAGERS: managers.people,
					};
					setPeople(next);
					setCanChange({
						MEMBERS: members.canChange,
						MANAGERS: managers.canChange,
					});
					// someone else may have made a staged change meanwhile
					setEdits((prev) => withoutSettledChanges(prev, next));
					setHasLoaded(true);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(getErrorMessage(e, "Could not read the team"));
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsLoading(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [groupId, admin, refreshCount]);

	const addPeople = (role: TeamRole, added: AccessPerson[]): number => {
		const currentKeys = new Set(people[role].map(getTeamPersonKey));
		// people in the list whose removal is staged stay instead
		const kept = added
			.map(getTeamPersonKey)
			.filter((key) => edits[role].removals.has(key));
		const newPeople = added.filter((person) => {
			const key = getTeamPersonKey(person);
			return !currentKeys.has(key) && !edits[role].adds.has(key);
		});
		if (newPeople.length > 0 || kept.length > 0) {
			setEdits((prev) => {
				const adds = new Map(prev[role].adds);
				for (const person of newPeople) {
					adds.set(getTeamPersonKey(person), person);
				}
				const removals = new Set(prev[role].removals);
				for (const key of kept) {
					removals.delete(key);
				}
				return { ...prev, [role]: { adds, removals } };
			});
		}
		return newPeople.length + kept.length;
	};

	const removePerson = (role: TeamRole, person: AccessPerson) => {
		setEdits((prev) => {
			const removals = new Set(prev[role].removals);
			removals.add(getTeamPersonKey(person));
			return { ...prev, [role]: { ...prev[role], removals } };
		});
	};

	const undoPeople = (role: TeamRole, keys: string[]) => {
		setEdits((prev) => ({
			...prev,
			[role]: withoutPeople(prev[role], keys),
		}));
	};

	const discard = () => setEdits(NO_TEAM_EDITS);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	const finishApply = () => {
		discard();
		setPeople(NO_PEOPLE);
		setCanChange(NO_CHANGES_ALLOWED);
		setHasLoaded(false);
		refresh();
	};

	return {
		people,
		canChange,
		isLoading,
		hasLoaded,
		error,
		edits,
		changeCount: countTeamChanges(edits),
		addPeople,
		removePerson,
		undoPeople,
		discard,
		refresh,
		finishApply,
	};
};
