import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type GroupAccessTarget,
	type GroupManager,
	getGroupManagers,
} from "@/api/teams";

export interface UseGroupManagersResult {
	/** The team's managers, empty until they load */
	managers: GroupManager[];
	/** Whether the team's managers are being read; true until the team's first read ends */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads the managers again */
	refresh: () => void;
}

/**
 * Reads the managers of a custom team, again whenever the team changes or
 * `refresh` is called. A read a newer one replaced is dropped.
 *
 * @param groupId - the team, or null to read nothing
 * @param admin - whether to use the admin endpoint
 * @param target - the project or engine the signed in user owns and is giving
 * the team access to, which lets them see its managers
 * @returns the managers and the state of the read
 */
export const useGroupManagers = (
	groupId: string | null,
	admin: boolean,
	target?: GroupAccessTarget,
): UseGroupManagersResult => {
	// read the target's fields so a new object for the same target reads nothing again
	const targetResource = target?.resource;
	const targetId = target?.resourceId;
	const [managers, setManagers] = useState<GroupManager[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);
	// the team the managers and error belong to, once a read for it has ended
	const [loadedGroupId, setLoadedGroupId] = useState<string | null>(null);

	useEffect(() => {
		if (!groupId || refreshCount < 0) {
			setManagers([]);
			setError(null);
			setIsLoading(false);
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getGroupManagers(
			groupId,
			admin,
			targetResource && targetId
				? { resource: targetResource, resourceId: targetId }
				: undefined,
		)
			.then((next) => {
				if (!isStale) {
					setManagers(next);
					setLoadedGroupId(groupId);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setManagers([]);
					setLoadedGroupId(groupId);
					setError(
						getErrorMessage(
							e,
							"Could not load the team's managers",
						),
					);
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
	}, [groupId, admin, targetResource, targetId, refreshCount]);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	// a team picked a moment ago has not been read yet, so it is still loading
	// rather than shown with no managers
	const isCurrent = Boolean(groupId) && loadedGroupId === groupId;
	return {
		managers: isCurrent ? managers : [],
		isLoading: Boolean(groupId) && (isLoading || !isCurrent),
		error: isCurrent ? error : null,
		refresh,
	};
};
