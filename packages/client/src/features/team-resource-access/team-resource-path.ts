import type { GroupAccessResource, TeamResource } from "@/api/teams";
import { getResourcePagePath } from "@/utility/catalog";

/**
 * The page of a project or engine a team can use.
 *
 * @param kind - Projects or engines.
 * @param resource - The project or engine.
 * @return Its path in the app, or null when it has no page.
 */
export const getTeamResourcePath = (
	kind: GroupAccessResource,
	resource: TeamResource,
): string | null =>
	getResourcePagePath(kind, resource.resourceType, resource.id);
