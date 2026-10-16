import { useEffect, useState } from "react";
import {
	getResourcePermissions,
	type ModelPublicUse,
	type ModelTotal,
	type ResourcePermissions,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

/** A model's total and public use limit, and what the user may change */
export interface ModelUsageLimits {
	/** The model total, or null until it is read and after a read fails */
	modelTotal: ModelTotal | null;
	/** The public use limit and whether the model is public, or null until it is read */
	publicUse: ModelPublicUse | null;
	/** Whether the user can change them: the model's owners, and admins in admin mode */
	canChangeModelLimits: boolean;
	/**
	 * Whether the model has known prices, so its limits can have cost rules.
	 * Until it is known, Cost is offered and the backend checks it on save.
	 */
	costLimitsAvailable: boolean;
	/** Whether a read is running */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads the limits again, keeping the ones shown until the read ends */
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
 * Reads a model's total and public use limit from its permissions.
 *
 * @param engineId - the model
 * @param admin - whether to read in admin mode
 * @returns the limits, what the user may change, and the read's state
 */
export const useModelUsageLimits = (
	engineId: string,
	admin = false,
): ModelUsageLimits => {
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<PermissionsRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = `${admin}:${engineId}`;

	useEffect(() => {
		// readCount is read so a refresh reads the limits again
		if (readCount < 0) {
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
	return {
		modelTotal: permissions?.modelTotal ?? null,
		publicUse: permissions?.publicUse ?? null,
		canChangeModelLimits:
			permissions?.allowedPermissionChanges.canChangeModelLimits ?? false,
		costLimitsAvailable: permissions?.costLimitsAvailable ?? true,
		isLoading,
		error,
		refresh: () => setReadCount((count) => count + 1),
	};
};
