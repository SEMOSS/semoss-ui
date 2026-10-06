import { z } from "@semoss/ui/next";

const threadActionSchema = z.object({
	id: z.string().min(1),
	threadId: z.string().min(1),
	action: z.enum([
		"ask",
		"draft",
		"reply",
		"forward",
		"read",
		"delete",
		"new-email",
	]),
	sourceMessageId: z.string().min(1).optional(),
	prompt: z.string().max(4000).optional(),
});

export type ThreadActionRequest = z.infer<typeof threadActionSchema>;

/** Validate navigation state before running a thread-scoped action. */
export function readThreadActionRequest(
	state: unknown,
	threadId: string,
): ThreadActionRequest | undefined {
	if (!state || typeof state !== "object" || !("threadAction" in state))
		return;
	const result = threadActionSchema.safeParse(state.threadAction);
	return result.success && result.data.threadId === threadId
		? result.data
		: undefined;
}
