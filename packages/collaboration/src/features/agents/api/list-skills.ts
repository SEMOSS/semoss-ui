import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** A skill is stored as its own project, so its id IS a project id. */
const SKILL_PROJECT_TYPE = "SKILL";

const skillProjectSchema = z.object({
	project_id: z.string(),
	project_name: z.string(),
	project_display_name: z.string().nullish(),
});

export const skillProjectListSchema = z.array(skillProjectSchema);

/** One attachable skill. */
export interface SkillOption {
	/** The skill's project id — what `EditWorkspace` and `AttachSkillToWorkspace` key on. */
	id: string;
	/** Display name shown alongside the stable id in the agent form. */
	name: string;
}

/** Use the skill's display name, not the project's namespace (such as "platform"). */
export function toSkillOption(
	row: z.infer<typeof skillProjectSchema>,
): SkillOption {
	return {
		id: row.project_id,
		name: row.project_display_name?.trim() || row.project_id,
	};
}

/**
 * List the skills the signed-in user can attach to an agent.
 *
 * `ListSkills` returns names and paths but no ids, and `AttachSkillToWorkspace`
 * and `EditWorkspace` both key on the skill's id — which is its project id, as
 * `SkillProjects.resolve(projectId)` shows. So the catalog comes from
 * `MyProjects`, the same reactor that lists agents.
 *
 * @param actions - `actions` from `useInsight()`.
 */
export async function listSkills(
	actions: InsightActions,
): Promise<SkillOption[]> {
	const rows = await callPixel(
		actions,
		pixel("MyProjects", { projectType: SKILL_PROJECT_TYPE }),
		skillProjectListSchema,
	);

	return rows.map(toSkillOption);
}

/**
 * Resolve the display names an agent form works in back to skill ids.
 *
 * @param names - Selected skill names.
 * @param catalog - Skills available to the user.
 * @returns The matching ids, and any name with no match in the catalog.
 */
export function resolveSkillIds(names: string[], catalog: SkillOption[]) {
	const byName = new Map(catalog.map((skill) => [skill.name, skill.id]));
	const ids: string[] = [];
	const unmatched: string[] = [];

	for (const name of names) {
		const id = byName.get(name);
		if (id) ids.push(id);
		else unmatched.push(name);
	}

	return { ids, unmatched };
}
