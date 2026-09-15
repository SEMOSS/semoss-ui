import type { Role } from "@semoss/sdk";

/**
 * -----------------------------------------------------------------------
 * TYPES -----------------------------------------------------------------
 * -----------------------------------------------------------------------
 */

/**
 * -----------------------------------------------------------------------
 * OTHER UTILITY FUNCTIONS -----------------------------------------------
 * -----------------------------------------------------------------------
 */
type AppPermission = "author" | "editor" | "readOnly" | "discoverable" | "";
export const determineUserPermission = (role: Role): AppPermission => {
	let permission: AppPermission = "";

	if (role === "OWNER") {
		permission = "author";
	} else if (role === "EDIT") {
		permission = "editor";
	} else if (role === "READ_ONLY") {
		permission = "readOnly";
	} else if (role === "DISCOVERABLE") {
		permission = "discoverable";
	}

	return permission;
};
