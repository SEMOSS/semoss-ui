import Logo from "@/assets/logo.svg";
import LogoLight from "@/assets/logo-light.svg";
import type { ALL_TYPES } from "./types";

const THEME_TITLE = import.meta.env.VITE_THEME_TITLE;

export const THEME = {
	name: THEME_TITLE || "SEMOSS",
	logo: Logo,
	logoLight: LogoLight,
};

export const PERMISSION_DESCRIPTION_MAP: Record<
	ALL_TYPES,
	Record<string, string>
> = {
	PROJECT: {
		author: "Ability to hide or delete the data app, provision other authors and all editor permissions",
		editor: "Ability to edit the data app code, provision other users as editors and read only users, and all  read-only permissions",
		readonly:
			"Ability to view the data app. User still requires permission to all dependent databases, models, remote storage, vector databases, etc",
	},
	FUNCTION: {
		author: "Ability to hide or delete the function, provision other authors, and all editor permissions",
		editor: "Ability to edit the function code, provision other users as editors and read-only users, and all read-only permissions",
		readonly: "Ability to execute the function",
	},
	MODEL: {
		author: "Ability to edit the model connection details, set the model as discoverable, delete the model, provision other authors, and all editor permissions",
		editor: "Ability to edit the model details, provision other users as editors and read-only users, and all read-only permissions",
		readonly: "Ability to run the model",
	},
	STORAGE: {
		author: "Ability to hide or delete the remote storage, provision other authors, and all editor permissions",
		editor: "Ability to push and delete files from the remote storage, and all read-only permissions",
		readonly: "Ability to view and pull files from the remote storage",
	},
	DATABASE: {
		author: "Ability to edit the database connection details, set the database as discoverable, delete the database, provision other authors, and all editor permissions",
		editor: "Ability to edit the database structure, provision other users as editors and read-only users, and all read-only permissions",
		readonly: "Ability to query and read data from the database",
	},
	VECTOR: {
		author: "Ability to hide or delete the vector database, provision other authors, and all editor permissions",
		editor: "Ability to add and remove files from the vector database, and all read-only permissions",
		readonly: "Ability to query against the vector database",
	},
	GUARDRAIL: {
		author: "Ability to hide or delete the guardrail, provision other authors, and all editor permissions",
		editor: "Ability to edit the guardrail code, provision other users as editors and read-only users, and all read-only permissions",
		readonly: "Ability to execute the guardrail",
	},
};

export const TYPE_TO_ROUTE = {
	PROJECT: "/app",
	CODE: "/app",
	BLOCKS: "/app",
	INSIGHT: "/app",
	SKILL: "/skill",
	WORKSPACE: "/agent",
	FUNCTION: "/function",
	MODEL: "/model",
	DATABASE: "/database",
	VECTOR: "/vector",
	STORAGE: "/storage",
	GUARDRAIL: "/guardrail",
} as const;

export const MCP = {
	DRIVER_PATHS: ["/py/mcp_driver.py"],
	JSON_PATHS: ["/mcp/py_mcp.json", "/mcp/pixel_mcp.json"],
} as const;
