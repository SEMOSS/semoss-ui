import type { TeamRole } from "@semoss/sdk";

/** What a team's Bulk Access Management says about one of its lists */
export interface TeamRoleCopy {
	/** The list's name, on its tab and its card */
	title: string;
	/** What being in the list means, under the card's title */
	description: string;
	/** What adding people does, on the Add People card */
	addDescription: string;
	/** The label of the list's search */
	searchLabel: string;
	/** Shown when the list is empty */
	emptyText: string;
	/** Shown when no one matches the search */
	noMatchText: string;
	/** The tooltip of a person's remove button */
	removeLabel: string;
	/** The name of a person's remove button */
	getRemoveName: (name: string) => string;
	/** The note when everyone copied from somewhere is already in the list */
	getAlreadyInText: (from: string) => string;
}

/** What a team's Bulk Access Management says about its members and its managers */
export const TEAM_ROLE_COPY: Record<TeamRole, TeamRoleCopy> = {
	MEMBERS: {
		title: "Members",
		description:
			"Everyone in this team can use the apps and engines it has been given.",
		addDescription:
			"Add people one by one, or use Bring In Access to copy them from another team or from the people given access to an app or engine.",
		searchLabel: "Search members",
		emptyText: "This team has no members yet",
		noMatchText: "No members match this search",
		removeLabel: "Remove From Team",
		getRemoveName: (name) => `Remove ${name} from the team`,
		getAlreadyInText: (from) =>
			`Everyone from ${from} is already in this team`,
	},
	MANAGERS: {
		title: "Managers",
		description: "Managers change who is in this team and who manages it.",
		addDescription:
			"Add managers one by one, or use Bring In Access to copy the managers of another team.",
		searchLabel: "Search managers",
		emptyText: "This team has no managers yet",
		noMatchText: "No managers match this search",
		removeLabel: "Remove as Manager",
		getRemoveName: (name) => `Remove ${name} as a manager`,
		getAlreadyInText: (from) =>
			`Everyone from ${from} already manages this team`,
	},
};
