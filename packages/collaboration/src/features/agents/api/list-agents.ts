import { pixel } from "@/lib/pixel";

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
