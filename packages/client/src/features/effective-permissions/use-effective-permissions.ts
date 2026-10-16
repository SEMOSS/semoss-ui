import { useCallback, useEffect, useState } from "react";
import {
	type EffectivePermissions,
	getEffectivePermissions,
	type PermissionTargetResource,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

export interface UseEffectivePermissionsResult {
	/** Everyone who can use the target, or null until it loads */
	access: EffectivePermissions | null;
	/** Whether it is being read */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads it again */
	refresh: () => void;
}

/**
 * Reads everyone who can use a project or engine in the end, one row per
 * person, again whenever the target changes or `refresh` is called. A read a
 * newer one replaced is dropped.
 *
 * @param target - the project or engine
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns the effective access and the state of the read
 */
export const useEffectivePermissions = (
	target: PermissionTargetResource,
	admin = false,
): UseEffectivePermissionsResult => {
	const { resourceType, id } = target;
	const [access, setAccess] = useState<EffectivePermissions | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);

	useEffect(() => {
		// refreshCount is read so a refresh reads the access again
		if (refreshCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getEffectivePermissions({ resourceType, id }, admin)
			.then((next) => {
				if (!isStale) {
					setAccess(next);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(
						getErrorMessage(e, "Could not read who can use this"),
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
	}, [resourceType, id, admin, refreshCount]);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	return { access, isLoading, error, refresh };
};
