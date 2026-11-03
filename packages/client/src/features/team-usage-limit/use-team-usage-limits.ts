import { useEffect, useState } from "react";
import {
	getResourcePermissions,
	type PermissionGrant,
	type ResourcePermissions,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import { getTeamLimitKey } from "./team-usage-limit";

/** The teams' access on a model, with their limits, and what the user may change */
export interface TeamUsageLimits {
	/**
	 * Each team's access on the model, with its limit, by `getTeamLimitKey`;
	 * null until it is read, and after a read fails
	 */
	grants: ReadonlyMap<string, PermissionGrant> | null;
	/** Whether a read is running */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/**
	 * Whether the user can change team limits: the model's owners, and admins in
	 * admin mode
	 */
	canChangeModelLimits: boolean;
	/**
	 * Whether the model has known prices, so its limits can have cost rules.
	 * Until it is known, or when it cannot be read, Cost is offered and the
	 * backend checks it when the limit is saved.
	 */
	costLimitsAvailable: boolean;
	/** Reads the access again, keeping the grants shown until the read ends */
	refresh: () => void;
}

/** A read of a model's permissions, with the model and mode it was read for */
interface PermissionsRead {
	/** The model and mode, as `admin:engineId` */
	key: string;
	/** What was read */
	permissions: ResourcePermissions;
}

/**
 * Reads the teams' access on a model with their usage limits, from the model's
 * permissions, so the Teams table can show and change each team's limit.
 *
 * @param engineId - the model, or null for anything else, which reads nothing
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns the teams' grants, what the user may change, and the read's state
 */
export const useTeamUsageLimits = (
	engineId: string | null,
	admin = false,
): TeamUsageLimits => {
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<PermissionsRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = engineId ? `${admin}:${engineId}` : null;

	useEffect(() => {
		// readCount is read so a refresh reads the access again
		if (!engineId || readCount < 0) {
			return;
		}
		const readKey = `${admin}:${engineId}`;
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getResourcePermissions({ resourceType: "ENGINE", id: engineId }, admin)
			.then((permissions) => {
				if (!isStale) {
					setRead({ key: readKey, permissions });
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					// a team's level may have changed, so nothing older is shown
					setRead(null);
					setError(getErrorMessage(e, "No reason was given."));
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
	}, [engineId, admin, readCount]);

	const permissions =
		read !== null && read.key === key ? read.permissions : null;
	return {
		grants: permissions
			? new Map(
					permissions.teams.map((team): [string, PermissionGrant] => [
						getTeamLimitKey(team.subject),
						team.access,
					]),
				)
			: null,
		isLoading: key !== null && isLoading,
		error: key !== null ? error : null,
		canChangeModelLimits:
			permissions?.allowedPermissionChanges.canChangeModelLimits ?? false,
		costLimitsAvailable: permissions?.costLimitsAvailable ?? true,
		refresh: () => setReadCount((count) => count + 1),
	};
};
