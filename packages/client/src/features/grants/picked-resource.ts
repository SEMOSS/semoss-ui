import type { EngineGranteeType } from "@semoss/sdk";
import type { Engine, Project } from "@semoss/shared";

/** An engine or a project picked in a dialog, as either side of a permission */
export interface PickedResource {
	/** ENGINE or PROJECT */
	resourceType: "ENGINE" | "PROJECT";
	/** Its id */
	id: string;
	/** An engine's catalog type, or PROJECT for a project */
	type: EngineGranteeType;
	/** An engine's subtype, or a project's type, such as SKILL */
	subtype: string | null;
	/** Its name */
	name: string;
}

/** The engine catalog types a permission names */
const ENGINE_RESOURCE_TYPES: readonly EngineGranteeType[] = [
	"MODEL",
	"STORAGE",
	"DATABASE",
	"FUNCTION",
	"VECTOR",
	"GUARDRAIL",
	"VENV",
];

/**
 * @param resource - an engine or a project picked
 * @returns a key naming it, as an engine and a project may share an id
 */
export const resourceKey = (resource: PickedResource): string =>
	`${resource.resourceType}:${resource.type}:${resource.id}`;

/**
 * @param engine - an engine picked
 * @returns the engine as a side of a permission, or null for a catalog type a
 * permission does not name
 */
export const toPickedEngine = (engine: Engine): PickedResource | null => {
	const type = ENGINE_RESOURCE_TYPES.find(
		(option) => option === engine.engine_type,
	);
	return type
		? {
				resourceType: "ENGINE",
				id: engine.engine_id,
				type,
				subtype: engine.engine_subtype ?? null,
				name:
					engine.engine_display_name ||
					engine.engine_name ||
					engine.engine_id,
			}
		: null;
};

/**
 * @param project - a project picked
 * @returns the project as a side of a permission
 */
export const toPickedProject = (project: Project): PickedResource => ({
	resourceType: "PROJECT",
	id: project.project_id,
	type: "PROJECT",
	subtype: project.project_type ?? null,
	name:
		project.project_display_name ||
		project.project_name ||
		project.project_id,
});
