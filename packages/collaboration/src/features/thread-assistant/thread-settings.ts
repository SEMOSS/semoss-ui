import { z } from "@semoss/ui/next";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";

/** User-authored settings, kept separate from the agent's inherited resources. */
export const threadSettingsSchema = z.object({
	modelId: z.string().min(1, "Choose a model."),
	agentId: z.string(),
	instructions: z.string().max(8000, "Use up to 8,000 characters."),
	temperature: z.number().min(0).max(1).nullable(),
	mcp: z.array(mcpConfigSchema),
});

export type ThreadChatSettings = z.infer<typeof threadSettingsSchema>;
