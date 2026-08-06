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
		type === "INSIGHT"
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

/**
 * Utility to check if the user has editor or owner permission.
 * @param permission
 * @returns true if the user can edit the resource, false otherwise
 */
export const isEditorPermission = (permission?: number): boolean => {
	return permission === 1 || permission === 2;
};

/**
 * Agents and skills can be cloned by anyone who can view them. Regular
 * projects require editor or owner permission because cloning copies the
 * project's contents into a new project.
 */
export const canCloneProject = (
	project: Pick<Project, "project_type" | "user_permission">,
): boolean => {
	if (
		project.project_type === "WORKSPACE" ||
		project.project_type === "SKILL"
	) {
		return true;
	}

	return isEditorPermission(project.user_permission);
};
