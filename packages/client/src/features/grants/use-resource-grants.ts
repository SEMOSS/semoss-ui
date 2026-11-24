import { useEffect, useState } from "react";
import {
	type AccessToEngine,
	getResourcePermissions,
	type ResourcePermissions,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import type { Grantee, GrantTarget } from "./grants";

/** What an engine or a project gives and is given, and what the user may change */
interface ResourceGrants {
	/**
	 * The apps, agents and engines it gives a permission to, as last read: null
	 * until they are read, and after a read fails. The list is the same one
	 * until the next read lands, so a table can tie state to it.
	 */
	grantees: readonly Grantee[] | null;
	/**
	 * The engines and projects that give it a permission, as last read: null
	 * until they are read, and after a read fails
	 */
	accessToEngines: readonly AccessToEngine[] | null;
	/**
	 * Whether the user can give, change and take away the permissions it gives:
	 * its owners, and admins in admin mode
	 */
	canChangeEngines: boolean;
	/**
	 * Whether only admins can give access to it, from its settings page in
	 * admin mode. Owners can still change and take away the access given.
	 */
	addsAreAdminOnly: boolean;
	/** On a model, whether the user can set usage limits: its owners, and admins in admin mode */
	canChangeModelLimits: boolean;
	/**
	 * Whether a model has known prices, so a limit can have cost rules. Until it
	 * is known, or when it cannot be read, Cost is offered and the backend
	 * checks it when the limit is saved.
	 */
	costLimitsAvailable: boolean;
	/** Whether a read is running, or the first one is about to start */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads again, keeping what is shown until the read ends */
	refresh: () => void;
}

/** A read, with the target and mode it was read for */
interface GrantsRead {
	/** The target and mode, as `admin:resourceType:id` */
	key: string;
	/** What was read */
	permissions: ResourcePermissions;
}

/**
 * Reads the permissions an engine or a project gives and is given, from its
 * permissions (`engines` and `accessToEngines`), with what the signed in user
 * may change. `refresh` bumps the count the read depends on, so it is read
 * again; a read that fails clears what was read, since a permission may have
 * changed, and a read for another target or mode is never returned as this
 * one's.
 *
 * @param target - the engine or project
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns what it gives and is given, what the user may change, and the read's state
 */
export const useResourceGrants = (
	target: GrantTarget,
	admin = false,
): ResourceGrants => {
	const { resourceType, id } = target;
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<GrantsRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = `${admin}:${resourceType}:${id}`;

	useEffect(() => {
		if (!id || readCount < 0) {
			return;
		}
		const readKey = `${admin}:${resourceType}:${id}`;
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getResourcePermissions({ resourceType, id }, admin)
			.then((permissions) => {
				if (!isStale) {
					setRead({ key: readKey, permissions });
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
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
	}, [resourceType, id, admin, readCount]);

	const permissions =
		read !== null && read.key === key ? read.permissions : null;
	return {
		grantees: permissions?.engines ?? null,
		accessToEngines: permissions?.accessToEngines ?? null,
		canChangeEngines:
			permissions?.allowedPermissionChanges.canChangeEngines ?? false,
		addsAreAdminOnly:
			permissions?.allowedPermissionChanges.addsAreAdminOnly ?? false,
		canChangeModelLimits:
			permissions?.allowedPermissionChanges.canChangeModelLimits ?? false,
		costLimitsAvailable: permissions?.costLimitsAvailable ?? true,
		isLoading:
			isLoading || (id !== "" && permissions === null && error === null),
		error,
		refresh: () => setReadCount((count) => count + 1),
	};
};
