import { useCallback, useEffect, useState } from "react";
import {
	getMyUsageLimitPath,
	getUsageLimitPath,
	type UsageLimitPath,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

/** Whose path to read on which model */
export interface UsageLimitPathRequest {
	/** The model */
	engineId: string;
	/** The person, by user id and login type; left out for the signed in person's own */
	person?: { id: string; type: string };
	/** Whether to read in admin mode; outside it an admin has only their own permissions */
	admin?: boolean;
}

export interface UseUsageLimitPathResult {
	/** How the limits apply, or null until it loads */
	path: UsageLimitPath | null;
	/** Whether it is being read */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads it again */
	refresh: () => void;
}

/**
 * Reads how usage limits apply to one person on a model: someone on the
 * model, for its editors and owners or admins, or the signed in person's own.
 * It reads again when the request changes or `refresh` is called, and drops a
 * read a newer one replaced.
 *
 * @param request - whose path to read, or null to read nothing
 * @returns the path and the state of the read
 */
export const useUsageLimitPath = (
	request: UsageLimitPathRequest | null,
): UseUsageLimitPathResult => {
	const engineId = request?.engineId ?? null;
	const personId = request?.person?.id ?? null;
	const personType = request?.person?.type ?? null;
	const admin = request?.admin === true;
	const [path, setPath] = useState<UsageLimitPath | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);

	useEffect(() => {
		// refreshCount is read so a refresh reads the path again
		if (!engineId || refreshCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		setPath(null);
		const read =
			personId !== null && personType !== null
				? getUsageLimitPath(
						engineId,
						{ id: personId, type: personType },
						admin,
					)
				: getMyUsageLimitPath(engineId);
		read.then((next) => {
			if (!isStale) {
				setPath(next);
			}
		})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(
						getErrorMessage(
							e,
							"Could not read how the limits apply",
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
	}, [engineId, personId, personType, admin, refreshCount]);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	return { path, isLoading, error, refresh };
};
