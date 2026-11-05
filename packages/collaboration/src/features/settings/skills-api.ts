import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** One of the owner's own Collaboration skills, and whether their assistant uses it in chats. */
export const mySkillSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	description: z.string().nullish().default(null),
	inAssistant: z.boolean(),
});

export const mySkillListSchema = z.object({ skills: z.array(mySkillSchema) });

export type MySkill = z.infer<typeof mySkillSchema>;

/** Turn one of the owner's skills on or off for their assistant's chats. */
export async function setSkillInAssistant(
	actions: InsightActions,
	skillId: string,
	use: boolean,
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkUseSkillInAssistant", { skillId, use }),
		z.unknown(),
	);
}
