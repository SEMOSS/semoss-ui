import type { GroupAccessResource } from "@/api/teams";

/** What the team pages call a kind of resource */
export interface TeamResourceNouns {
	/** One of them, such as "project" */
	singular: string;
	/** Several of them, such as "projects" */
	plural: string;
	/** A heading, such as "Projects" */
	title: string;
}

/** The words for each kind of resource a team can have access to */
export const TEAM_RESOURCE_NOUNS: Record<
	GroupAccessResource,
	TeamResourceNouns
> = {
	PROJECT: { singular: "project", plural: "projects", title: "Projects" },
	ENGINE: { singular: "engine", plural: "engines", title: "Engines" },
};
