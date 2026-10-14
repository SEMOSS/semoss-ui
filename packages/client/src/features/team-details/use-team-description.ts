import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
import {
	type GroupKey,
	getGroupDetails,
	readTeamDescription,
} from "@/api/teams";

export interface UseTeamDescriptionResult {
	/** The team's description, or null when it has none or it has not loaded */
	description: string | null;
	/** Whether the read is in flight; it is true until the first read ends */
	isLoading: boolean;
	/** Why the read failed, or null */
	error: string | null;
	/** Reads the description again, such as after a failed read */
	refresh: () => void;
}

/**
 * Reads a team's description, again when the team or `refreshKey` changes.
 *
 * @param group - the team. Keep the object stable, such as with useMemo.
 * @param admin - whether to use the admin endpoint; a team's managers use the other
 * @param refreshKey - changing it reads the description again, such as after an edit
 * @returns the description and the state of the read
 */
export const useTeamDescription = (
	group: GroupKey,
	admin: boolean,
	refreshKey = 0,
): UseTeamDescriptionResult => {
	const [description, setDescription] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		// refreshKey and retryCount are read so an edit or a retry reads it again
		if (refreshKey < 0 || retryCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getGroupDetails(admin, group.id, group.type)
			.then((details: unknown) => {
				if (!isStale) {
					setDescription(
						isRecord(details)
							? (readTeamDescription(
									details.description,
								)?.trim() ?? null)
							: null,
					);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setDescription(null);
					setError(getErrorMessage(e, "Could not load the team"));
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
	}, [group, admin, refreshKey, retryCount]);

	const refresh = useCallback(() => setRetryCount((count) => count + 1), []);

	return { description, isLoading, error, refresh };
};
