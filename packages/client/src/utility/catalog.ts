import type { Engine, Project } from "@semoss/shared";
/**
 * Utility to check if it is a project type
 * @param type
 * @returns true if a project type, false otherwise
 */
export const isProjectType = (type?: string): boolean => {
	return (
		type === "SKILL" ||
		type === "WORKSPACE" ||
		type === "BLOCKS" ||
		type === "CODE" ||
		type === "INSIGHT" ||
		type === "NOTEBOOK" ||
		type === "AUTOMATION"
	);
};

/**
 * Get the label for a project type
 * @param type
 * @returns the label for the project type
 */
export const getProjectLabel = (type?: Project["project_type"]): string => {
	if (type === "SKILL") {
		return "Skill";
	} else if (type === "WORKSPACE") {
		return "Agent";
	} else if (type === "BLOCKS") {
		return "Blocks";
	} else if (type === "CODE") {
		return "Code";
	} else if (type === "INSIGHT") {
		return "Insight";
	} else if (type === "NOTEBOOK") {
		return "Notebook";
	} else if (type === "AUTOMATION") {
		return "Automation";
	}

	return "Project";
};

/**
 * Utility to check if it is a engine type
 * @param type
 * @returns true if an engine type, false otherwise
 */
export const isEngineType = (type?: string): boolean => {
	return (
		type === "MODEL" ||
		type === "STORAGE" ||
		type === "DATABASE" ||
		type === "FUNCTION" ||
		type === "VECTOR" ||
		type === "GUARDRAIL"
	);
};

/**
 * Get the label for a project type
 * @param type
 * @returns the label for the project type
 */
export const getEngineLabel = (type?: Engine["engine_type"]): string => {
	if (type === "MODEL") {
		return "Model";
	} else if (type === "STORAGE") {
		return "Storage";
	} else if (type === "DATABASE") {
		return "Database";
	} else if (type === "FUNCTION") {
		return "Function";
	} else if (type === "VECTOR") {
		return "Vector";
	} else if (type === "GUARDRAIL") {
		return "Guardrail";
	}

	return "Project";
};

/**
 * Utility to check if user has owner permission
 * @param permission
 * @returns true if the user has owner permission, false otherwise
 */
export const isOwnerPermission = (
	permission?: number | string | null,
): boolean => {
	return permission === 1 || permission === "OWNER";
};

/** An access filter the catalog filter box offers, as the backend counts it. */
export type CatalogAccessFilter =
	| "CREATED_BY_ME"
	| "OWNER"
	| "EDIT"
	| "READ_ONLY";

/** The access filters, in display order, with their labels. */
export const CATALOG_ACCESS_FILTERS: readonly {
	value: CatalogAccessFilter;
	label: string;
}[] = [
	{ value: "CREATED_BY_ME", label: "Created by Me" },
	{ value: "OWNER", label: "Owner" },
	{ value: "EDIT", label: "Can Edit" },
	{ value: "READ_ONLY", label: "View Only" },
];

/** The permission level each access filter keeps. */
const ACCESS_PERMISSION_LEVELS: Partial<Record<CatalogAccessFilter, number>> = {
	OWNER: 1,
	EDIT: 2,
	READ_ONLY: 3,
};

/**
 * The `MyProjects` / `MyEngines` arguments for the chosen access filters: the
 * permission filters keep a resource the user holds any of them on, and
 * Created by Me narrows to what the user made.
 *
 * @param access - The chosen access filters.
 * @returns The arguments, each followed by `, `; empty when none are chosen.
 */
export const buildAccessFilterParams = (
	access: readonly CatalogAccessFilter[],
): string => {
	const levels = access.flatMap((filter) => {
		const level = ACCESS_PERMISSION_LEVELS[filter];
		return level === undefined ? [] : [level];
	});
	return `${levels.length > 0 ? `effectivePermissions=${JSON.stringify(levels)}, ` : ""}${
		access.includes("CREATED_BY_ME") ? "createdByMe=[true], " : ""
	}`;
};
