import { z } from "@semoss/ui/next";
import type { MCPConfig, SkillConfig } from "@/types";

export const createWorkspaceFormSchema = (requiredMessage: string) =>
	z.object({
		name: z.string().trim().min(1, requiredMessage),
		description: z.string(),
		instructions: z.string(),
		knowledge: z.array(z.custom<MCPConfig>()),
		toolbox: z.array(z.custom<MCPConfig>()),
		skills: z.array(z.custom<SkillConfig>()),
		prompts: z.array(z.string()),
	});
export type WorkspaceFormValues = z.infer<
	ReturnType<typeof createWorkspaceFormSchema>
>;
export const emptyWorkspaceForm: WorkspaceFormValues = {
	name: "",
	description: "",
	instructions: "",
	knowledge: [],
	toolbox: [],
	skills: [],
	prompts: [],
};
