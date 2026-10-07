import { z } from "@semoss/ui/next";

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
