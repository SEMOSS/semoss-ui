import { useEffect, useState } from "react";
import {
	type GranteePermission,
	type GranteePermissionPage,
	getAllGranteePermissions,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

/** What to read: the filters and the page */
export interface GrantedAccessQuery {
	/** Text the name or id of either side contains, or empty for any */
	search: string;
	/** Whether the target is a project or an engine */
	targetKind: "PROJECT" | "ENGINE";
	/** The target's type, or empty for any */
	targetType: string;
	/** Whether the one given access is a project, such as an app or an agent, or an engine */
	granteeKind: "PROJECT" | "ENGINE";
	/** The type of the one given access, or empty for any */
	granteeType: string;
	/** How many to read */
	limit: number;
	/** How many to skip */
	offset: number;
}

/** A page of permissions and the read's state */
interface GrantedAccess {
	/**
	 * The page as last read: null until it is read, and after a read fails. It
	 * stays the same until the next read lands.
	 */
	grants: readonly GranteePermission[] | null;
	/** How many match the filters in all, as last read */
	total: number;
	/** Whether a read is running, or the first one is about to start */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads the page again, keeping the one shown until the read ends */
	refresh: () => void;
}

/** A read, with the query and mode it was read for */
interface GrantedAccessRead {
	/** The query and mode, as JSON */
	key: string;
	/** What was read */
	page: GranteePermissionPage;
}

/**
 * Reads a page of the permissions engines and projects give apps, agents and
 * engines, of one kind on each side: on the ones the user can edit, or on
 * every one in admin mode. A read for another query or mode is never returned
 * as this one's, and a read that fails clears the page. `refresh`, or a new
 * `version` from the page, reads it again.
 *
 * @param query - the filters and the page
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @param version - a count the page bumps to read every list again, such as
 * after Add Access saves
 * @returns the page, how many match, and the read's state
 */
export const useGrantedAccess = (
	query: GrantedAccessQuery,
	admin = false,
	version = 0,
): GrantedAccess => {
	const {
		search,
		targetKind,
		targetType,
		granteeKind,
		granteeType,
		limit,
		offset,
	} = query;
	const [readCount, setReadCount] = useState(0);
	const [read, setRead] = useState<GrantedAccessRead | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = JSON.stringify([
		admin,
		search,
		targetKind,
		targetType,
		granteeKind,
		granteeType,
		limit,
		offset,
	]);

	useEffect(() => {
		if (readCount < 0 || version < 0) {
			return;
		}
		const readKey = JSON.stringify([
			admin,
			search,
			targetKind,
			targetType,
			granteeKind,
			granteeType,
			limit,
			offset,
		]);
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getAllGranteePermissions(
			{
				search,
				targetKind,
				targetType,
				granteeKind,
				granteeType,
				limit,
				offset,
			},
			admin,
		)
			.then((page) => {
				if (!isStale) {
					setRead({ key: readKey, page });
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
	}, [
		admin,
		search,
		targetKind,
		targetType,
		granteeKind,
		granteeType,
		limit,
		offset,
		readCount,
		version,
	]);

	const page = read !== null && read.key === key ? read.page : null;
	return {
		grants: page?.grants ?? null,
		total: page?.total ?? 0,
		isLoading: isLoading || (page === null && error === null),
		error,
		refresh: () => setReadCount((count) => count + 1),
	};
};
