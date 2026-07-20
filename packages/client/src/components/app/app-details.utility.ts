import type { Role } from "@/types";

/**
 * -----------------------------------------------------------------------
 * TYPES -----------------------------------------------------------------
 * -----------------------------------------------------------------------
 */

export interface engine {
	app_cost: string;
	app_favorite: number;
	app_id: string;
	app_name: string;
	app_subtype: string;
	app_type: string;
	database_cost: string;
	database_discoverable: false;
	database_favorite: number;
	database_global: false;
	database_id: string;
	database_name: string;
	database_subtype: string;
	database_type: string;
	low_database_name: string;
	permission: number;
	user_permission: Role;
	description: string;
	access_permission: number;
}

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
