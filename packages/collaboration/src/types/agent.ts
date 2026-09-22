import type { Origin } from "./origin";

export type AgentIcon = "compass" | "briefcase" | "chart" | "pen" | "users";
export type AgentTone = "green" | "teal" | "blue" | "amber";
export type WorkspaceView =
	| "Conversation"
	| "Travel itinerary"
	| "Executive brief";

export interface Agent {
	id: string;
	name: string;
	role: string;
	type: "Individual" | "Team";
	avatar?: string;
	icon: AgentIcon;
	tone: AgentTone;
	workspace: WorkspaceView;
	instructions: string;
	skills: string[];
	/** Stable project ids for selected skills; `skills` contains display names. */
	skillIds?: string[];
	databases: string[];
	dataProducts: string[];
	members: string[];
	depth: number;
	concurrency: number;
	spawn: boolean;
	triggers: {
		id: string;
		name: string;
		source: Exclude<Origin, "You">;
		condition: string;
		enabled: boolean;
	}[];
}
