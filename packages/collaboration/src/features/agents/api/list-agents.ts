import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type ProjectRow, projectListSchema } from "./agent-schemas";

/** Project type that identifies an agent workspace, per `IProject.PROJECT_TYPE`. */
const WORKSPACE_PROJECT_TYPE = "WORKSPACE";

/**
 * List the agents the signed-in user can see.
 *
 * Uses `MyProjects` rather than `ListWorkspaces`: the latter returns name and
 * description in a single call but is marked `@Deprecated` server-side.
 *
 * TODO:: MyProjects returns no workspace description, so Agent.description is empty in
 * list views. Either hydrate each row via GetWorkspace (N+1) or extend
 * MyProjects server-side to include it.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param options.limit - Page size; omit for the server default.
 * @param options.offset - Page offset.
 */
export async function listAgents(
	actions: InsightActions,
	options: { limit?: number; offset?: number } = {},
): Promise<ProjectRow[]> {
	return callPixel(
		actions,
		pixel("MyProjects", {
			projectType: WORKSPACE_PROJECT_TYPE,
			limit: options.limit,
			offset: options.offset,
		}),
		projectListSchema,
	);
}
