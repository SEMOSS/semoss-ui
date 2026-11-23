import { z } from "@semoss/ui/next";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const twinSkillSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.refine(
			(value) => !/[\\/]/.test(value) && !value.includes(".."),
			"Use a name without slashes or two consecutive dots.",
		),
	description: z.string().trim().min(1, "Description is required"),
	content: z.string().trim().min(1, "Instructions are required"),
});

export type TwinSkillValues = z.infer<typeof twinSkillSchema>;

/** Read the complete saved instructions, with the server enforcing view access. */
export function readTwinSkill(
	actions: InsightActions,
	skillId: string,
): Promise<string> {
	return callPixel(
		actions,
		pixel("ReadSkillFile", { project: skillId, filePath: "SKILL.md" }),
		z.string(),
	);
}

/** Save a reusable skill in the owner's catalog before attaching it to a twin. */
export async function createTwinSkill(
	actions: InsightActions,
	values: TwinSkillValues,
): Promise<CatalogSkill> {
	const { name, description, content } = twinSkillSchema.parse(values);
	const saved = await callPixel(
		actions,
		pixel("CreateSkill", {
			catalogName: name,
			description,
			skillContent: content,
		}),
		z.object({ project_id: z.string().min(1), name: z.string() }),
	);
	return { id: saved.project_id, name: saved.name, description };
}
