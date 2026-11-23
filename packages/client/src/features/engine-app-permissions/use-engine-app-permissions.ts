import { useEffect, useMemo, useState } from "react";
import { getResourcePermissions, type ResourcePermissions } from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import { APP_GRANTEE_TYPE, type EngineApp } from "./engine-app-permissions";

/** The apps an engine gives a permission to, and what the user may change */
interface EngineAppPermissions {
	/**
	 * The apps with a permission on the engine, as last read: null until they
	 * are read, and after a read fails. The list is the same one until the next
	 * read lands.
	 */
	apps: readonly EngineApp[] | null;
	/**
	 * Whether the user can give, change and take away an app's permission: the
	 * engine's owners, and admins in admin mode
	 */
	canChangeEngines: boolean;
	/**
	 * Whether only admins can give an app access to the engine, from its
	 * settings page in admin mode. Owners can still change and take away the
	 * access apps have.
	 */
	addsAreAdminOnly: boolean;
	/**
	 * On a model, whether the user can set usage limits: its owners, and admins
	 * in admin mode
	 */
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
	/** Reads the apps again, keeping the ones shown until the read ends */
	refresh: () => void;
}

/** A read of an engine's permissions, with the engine and mode it was read for */
interface PermissionsRead {
	/** The engine and mode, as `admin:engineId` */
	key: string;
	/** What was read */
	permissions: ResourcePermissions;
}

/**
 * Reads the apps an engine gives a permission to, from the engine's
 * permissions (its grantees of type PROJECT), with what the signed in user may
 * change, so the Apps table can
 * show and change them. `refresh` bumps the count the read depends on, so the
 * apps are read again; a read that fails clears the apps, since a permission
 * may have changed, and a read for another engine or mode is never returned as
 * this one's.
 *
 * @param engineId - the engine
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns the apps, what the user may change, and the read's state
 */
export const useEngineAppPermissions = (
	engineId: string,
	admin = false,
): EngineAppPermissions => {
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<PermissionsRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = `${admin}:${engineId}`;

	useEffect(() => {
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
	const apps = useMemo(
		() =>
			permissions?.engines.filter(
				(grantee) => grantee.subject.type === APP_GRANTEE_TYPE,
			) ?? null,
		[permissions],
	);
	return {
		apps,
		canChangeEngines:
			permissions?.allowedPermissionChanges.canChangeEngines ?? false,
		addsAreAdminOnly:
			permissions?.allowedPermissionChanges.addsAreAdminOnly ?? false,
		canChangeModelLimits:
			permissions?.allowedPermissionChanges.canChangeModelLimits ?? false,
		costLimitsAvailable: permissions?.costLimitsAvailable ?? true,
		isLoading:
			isLoading ||
			(engineId !== "" && permissions === null && error === null),
		error,
		refresh: () => setReadCount((count) => count + 1),
	};
};
