import type { ALL_TYPES } from "@/types";

/** The engine types, which all delete with DeleteEngine, or AdminDeleteEngine in admin mode */
const ENGINE_TYPES: ALL_TYPES[] = [
	"DATABASE",
	"STORAGE",
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"FUNCTION",
];

/** The pixel that deletes a resource, and what the product calls it. */
interface DeleteRequest {
	/** The delete pixel */
	pixel: string;
	/** What the product calls the resource, such as "engine" or "agent" */
	entityLabel: string;
}

/**
 * Builds the pixel that deletes an engine or a project. A project deletes by
 * its project type: an agent with DeleteWorkspace, a skill with DeleteSkill,
 * and any other project with DeleteProject. Those pixels delete what the user
 * owns. In admin mode each is the pixel of the same name with Admin in front
 * (AdminDeleteEngine, AdminDeleteWorkspace, AdminDeleteSkill,
 * AdminDeleteProject), which deletes any engine or project for an admin.
 *
 * @param type - The resource's type: an engine type, or PROJECT.
 * @param id - The resource's id.
 * @param projectType - For a project, its project type.
 * @param admin - Whether the delete is made in admin mode.
 * @returns The request, or null for a type that is not deleted this way.
 */
export const getDeleteRequest = (
	type: ALL_TYPES,
	id: string,
	projectType?: string,
	admin = false,
): DeleteRequest | null => {
	if (ENGINE_TYPES.includes(type)) {
		return {
			pixel: `${admin ? "AdminDeleteEngine" : "DeleteEngine"}(engine=['${id}']);`,
			entityLabel: "engine",
		};
	}
	if (type !== "PROJECT") {
		return null;
	}
	if (projectType === "WORKSPACE") {
		return {
			pixel: `${admin ? "AdminDeleteWorkspace" : "DeleteWorkspace"}(workspaceId=['${id}']);`,
			entityLabel: "agent",
		};
	}
	if (projectType === "SKILL") {
		return {
			pixel: `${admin ? "AdminDeleteSkill" : "DeleteSkill"}(skillId=['${id}']);`,
			entityLabel: "skill",
		};
	}
	return {
		pixel: `${admin ? "AdminDeleteProject" : "DeleteProject"}(project=['${id}']);`,
		entityLabel: projectType === "NOTEBOOK" ? "notebook" : "app",
	};
};
