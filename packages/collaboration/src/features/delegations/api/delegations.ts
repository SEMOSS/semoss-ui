import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const delegationSchema = z.object({
	actionId: z.string(),
	status: z.string(),
	roomId: z.string().nullish(),
	requesterName: z.string().nullish(),
	question: z.string().nullish(),
	context: z.string().nullish(),
	responseFormat: z.string().nullish(),
	dueAt: z.string().nullish(),
	response: z.string().nullish(),
	dateCreated: z.string().nullish(),
	decidedAt: z.string().nullish(),
	// Only returned by RespondToDelegation: the owner-side outcome.
	taskStatus: z.string().nullish(),
});

export type Delegation = z.infer<typeof delegationSchema>;

/** Delegations assigned to the logged-in user, newest first. */
export function listAssignedDelegations(
	actions: InsightActions,
	status?: string,
): Promise<Delegation[]> {
	return callPixel(
		actions,
		pixel("GetAssignedDelegations", { status }),
		z.array(delegationSchema),
	);
}

/** File the delegation room under one of the user's agents so it opens there. */
export function attachRoomToAgent(
	actions: InsightActions,
	roomId: string,
	workspaceId: string,
): Promise<boolean> {
	return callPixel(
		actions,
		pixel("SetRoomWorkspace", { roomId, workspaceId }),
		z.boolean(),
	);
}
