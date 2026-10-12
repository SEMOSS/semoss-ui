/** What shows under Member Permissions on an access control page */
export type AccessControlView =
	| "MEMBERS"
	| "BULK_ACCESS_MANAGEMENT"
	| "EFFECTIVE";

/** The part of an app's or engine's path that leads to its access control tab */
const ACCESS_CONTROL_SEGMENT = "/access-control";

/**
 * The path of the access control tab a page is on, so its views can link to
 * each other wherever the tab lives. An access control page shown elsewhere,
 * such as in a workbench panel, has none.
 *
 * @param pathname - the current path, such as "/model/abc/access-control/bulk-access-management"
 * @returns the tab's path, such as "/model/abc/access-control", or null
 */
export const getAccessControlPath = (pathname: string): string | null => {
	const index = pathname.lastIndexOf(ACCESS_CONTROL_SEGMENT);
	if (index < 0) {
		return null;
	}
	const end = index + ACCESS_CONTROL_SEGMENT.length;
	// a longer segment such as "/access-controls" is not the tab
	const next = pathname.charAt(end);
	return next === "" || next === "/" ? pathname.slice(0, end) : null;
};
