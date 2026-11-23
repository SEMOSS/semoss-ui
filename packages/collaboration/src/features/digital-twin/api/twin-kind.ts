import { z } from "@semoss/ui/next";
import { projectListSchema } from "@/features/agents/api/agent-schemas";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/**
 * What an agent is to the signed-in person, for a chat that is not with their
 * own Digital Twin: a twin they share, a twin someone shared with them, or
 * any other agent.
 */
export type TwinKind =
	| { kind: "agent" }
	| { kind: "ownTwin" }
	| {
			kind: "sharedTwin";
			/** Whose twin it is; left out when the server cannot tell. */
			ownerName?: string;
	  };

// the server's mark on a twin, as the twin lists filter by it (api/digital-twin.ts)
const TWIN_FILTER = {
	projectType: "WORKSPACE",
	metaFilters: { digital_twin: ["true"] },
	noMeta: true,
};
const rowsSchema = projectListSchema.element
	.extend({ digital_twin_owner_name: z.string().nullish() })
	.array();

/**
 * Tell which of the three an agent is, from its own row in the twin list and
 * in the list of twins the person created.
 *
 * @param agentId - The agent a chat runs on.
 * @throws {PixelError} when either list cannot be read.
 */
export async function getTwinKind(
	actions: InsightActions,
	agentId: string,
): Promise<TwinKind> {
	const row = { ...TWIN_FILTER, project: agentId, limit: 1 };
	const [twins, mine] = await Promise.all([
		callPixel(actions, pixel("MyProjects", row), rowsSchema),
		callPixel(
			actions,
			pixel("MyProjects", { ...row, createdByMe: true }),
			rowsSchema,
		),
	]);
	const twin = twins.find((entry) => entry.project_id === agentId);
	if (!twin) return { kind: "agent" };
	if (mine.some((entry) => entry.project_id === agentId))
		return { kind: "ownTwin" };
	return {
		kind: "sharedTwin",
		ownerName: twin.digital_twin_owner_name?.trim() || undefined,
	};
}
