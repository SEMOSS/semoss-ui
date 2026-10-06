import { z } from "@semoss/ui/next";

const requestSchema = z.object({
	id: z.string().min(1),
	threadId: z.string().min(1),
});

export type ThreadWorkbenchRequest = z.infer<typeof requestSchema>;

/** History state can be stale, malformed, or intended for another thread. */
export function readThreadWorkbenchRequest(
	state: unknown,
	threadId: string,
): ThreadWorkbenchRequest | undefined {
	if (!state || typeof state !== "object" || !("threadWorkbench" in state))
		return;
	const result = requestSchema.safeParse(state.threadWorkbench);
	return result.success && result.data.threadId === threadId
		? result.data
		: undefined;
}
