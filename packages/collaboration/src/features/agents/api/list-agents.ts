import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type ProjectRow, projectListSchema } from "./agent-schemas";

/** Project type that identifies an agent workspace, per `IProject.PROJECT_TYPE`. */
const WORKSPACE_PROJECT_TYPE = "WORKSPACE";

export interface ListAgentsOptions {
	/** Text matched by `MyProjects` against workspace names and identifiers. */
	filterWord?: string;
	/** Page size; omit for the server default. */
	limit?: number;
	/** Zero-based page offset. */
	offset?: number;
}

/** Builds the validated agent-list request shared by list and iterator queries. */
export function agentListPixel(options: ListAgentsOptions = {}): string {
	return pixel("MyProjects", {
		filterWord: options.filterWord?.trim() || undefined,
		projectType: WORKSPACE_PROJECT_TYPE,
		limit: options.limit,
		offset: options.offset,
	});
}

/**
 * List the agents the signed-in user can see.
 *
 * Uses `MyProjects` rather than `ListWorkspaces`: the latter returns name and
 * description in a single call but is marked `@Deprecated` server-side.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param options.filterWord - Optional server-side name or identifier search.
 * @param options.limit - Page size; omit for the server default.
 * @param options.offset - Page offset.
 */
export async function listAgents(
	actions: InsightActions,
	options: ListAgentsOptions = {},
): Promise<ProjectRow[]> {
	return callPixel(actions, agentListPixel(options), projectListSchema);
}
