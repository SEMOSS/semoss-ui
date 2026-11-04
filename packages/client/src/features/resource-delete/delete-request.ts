import type { ALL_TYPES } from "@/types";

/** The engine types, which all delete with DeleteEngine */
const ENGINE_TYPES: ALL_TYPES[] = [
	"DATABASE",
	"STORAGE",
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"FUNCTION",
];

/** The pixel that deletes a resource, and what the product calls it. */
export interface DeleteRequest {
	/** The delete pixel */
	pixel: string;
	/** What the product calls the resource, such as "engine" or "agent" */
	entityLabel: string;
}

/**
 * Builds the pixel that deletes an engine or a project. A project deletes by
 * its project type: an agent with DeleteWorkspace, a skill with DeleteSkill,
 * and any other project with DeleteProject.
 *
 * @param type - The resource's type: an engine type, or PROJECT.
 * @param id - The resource's id.
 * @param projectType - For a project, its project type.
 * @returns The request, or null for a type that is not deleted this way.
 */
export const getDeleteRequest = (
	type: ALL_TYPES,
	id: string,
	projectType?: string,
): DeleteRequest | null => {
	if (ENGINE_TYPES.includes(type)) {
		return {
			pixel: `DeleteEngine(engine=['${id}']);`,
			entityLabel: "engine",
		};
	}
	if (type !== "PROJECT") {
		return null;
	}
	if (projectType === "WORKSPACE") {
		return {
			pixel: `DeleteWorkspace(workspaceId=['${id}']);`,
			entityLabel: "agent",
		};
	}
	if (projectType === "SKILL") {
		return {
			pixel: `DeleteSkill(skillId=['${id}']);`,
			entityLabel: "skill",
		};
	}
	return {
		pixel: `DeleteProject(project=['${id}']);`,
		entityLabel: projectType === "NOTEBOOK" ? "notebook" : "app",
	};
};
