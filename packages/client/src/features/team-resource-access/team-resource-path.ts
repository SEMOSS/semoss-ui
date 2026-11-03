import type { GroupAccessResource, TeamResource } from "@/api/teams";
import { TYPE_TO_ROUTE } from "@/constants";

const isRoutedType = (type: string): type is keyof typeof TYPE_TO_ROUTE =>
	Object.hasOwn(TYPE_TO_ROUTE, type);

/**
 * The page of a project or engine a team can use. A project whose type has no
 * pages of its own opens in the app pages, which load any project; an engine
 * whose type has no pages has none.
 *
 * @param kind - Projects or engines.
 * @param resource - The project or engine.
 * @return Its path in the app, or null when it has no page.
 */
export const getTeamResourcePath = (
	kind: GroupAccessResource,
	resource: TeamResource,
): string | null => {
	const route =
		resource.resourceType && isRoutedType(resource.resourceType)
			? TYPE_TO_ROUTE[resource.resourceType]
			: kind === "PROJECT"
				? TYPE_TO_ROUTE.PROJECT
				: null;
	return route ? `${route}/${encodeURIComponent(resource.id)}` : null;
};
