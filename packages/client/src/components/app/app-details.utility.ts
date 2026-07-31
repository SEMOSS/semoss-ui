import type { Role } from "@/types";

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
