import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

export type ActivitySort = "date-desc" | "date-asc" | "name-asc" | "name-desc";
export type ActivityGroup = "recent" | "agent";
export type ActivitySource = "all" | "human" | "automated";
export type ActivityPeriod = "7" | "all";

export interface ActivityFilters {
	query?: string;
	group?: ActivityGroup;
	source?: ActivitySource;
	period?: ActivityPeriod;
	showRoutine?: boolean;
	now?: number;
}

export interface ActivityRow {
	agent?: Agent;
	agentName: string;
	session: Session;
	updatedTime: number | null;
}
