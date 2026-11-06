import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const text = z
	.string()
	.nullish()
	.transform((value) => value ?? "")
	.default("");

/** Validated detail contract shared by the management pane and room context. */
export const workItemSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	status: z.enum(["active", "waiting", "blocked", "done", "dropped"]),
	state: text,
	description: text,
	nextStep: text,
	waitingOnPersonId: text,
	due: text,
	priority: text,
	roomId: text,
	selfId: text,
	topics: z.array(z.object({ id: z.string(), name: text })).default([]),
	rooms: z
		.array(z.object({ roomId: z.string(), linkedAt: text }))
		.default([]),
	steps: z
		.array(
			z.object({
				id: z.string(),
				text: text,
				kind: text,
				status: text,
				assigneeId: text,
				assigneeName: text,
			}),
		)
		.default([]),
	threads: z
		.array(
			z.object({
				threadId: z.string(),
				subject: text,
				source: text,
			}),
		)
		.default([]),
	timeline: z.array(z.object({ id: z.string(), text: text })).default([]),
});

export type WorkItemRecord = z.infer<typeof workItemSchema>;

/** Updates a work item, rejecting missing or mismatched server confirmation. */
export async function saveWorkItem(
	actions: InsightActions,
	taskId: string,
	changes: Record<string, unknown>,
): Promise<WorkItemRecord> {
	const saved = await callPixel(
		actions,
		pixel("WorkSaveWork", { ...changes, taskId }),
		workItemSchema,
	);
	if (saved.id !== taskId)
		throw new Error("The server confirmed a different work item.");
	return saved;
}
