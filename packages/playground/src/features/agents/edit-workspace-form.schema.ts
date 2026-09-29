import { AGENT_MAX_GREETING_LENGTH } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { createWorkspaceFormSchema } from "./workspace-form.schema";

/** Keeps the existing editor validation while retaining the full agent configuration. */
export const createEditWorkspaceFormSchema = (requiredMessage: string) => {
	const base = createWorkspaceFormSchema(requiredMessage);
	return base.omit({ toolbox: true }).extend({
		toolboxes: base.shape.toolbox,
		greeting: z.string().max(AGENT_MAX_GREETING_LENGTH),
		greetingEnabled: z.boolean(),
		modelId: z.string(),
		useDefaultAgentTools: z.boolean(),
		disabledDefaultTools: z.array(z.string()),
		maxTurns: z.string(),
		maxReflections: z.string(),
		maxSeconds: z.string(),
		maxSubagentDepth: z.string(),
		maxSubagentsPerRun: z.string(),
		maxSpawnsPerTurn: z.string(),
		subagents: z.array(z.object({ workspaceId: z.string() })),
		hooks: z.array(
			z.object({
				kind: z.string(),
				pixel: z.string().optional(),
				events: z.array(z.string()).optional(),
			}),
		),
	});
};

export type EditWorkspaceFormValues = z.infer<
	ReturnType<typeof createEditWorkspaceFormSchema>
>;
