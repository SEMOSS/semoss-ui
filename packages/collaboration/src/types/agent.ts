import type { MCPConfig } from "@semoss/shared";

export type AgentIcon = "compass" | "briefcase" | "chart" | "pen" | "users";
export type AgentTone = "green" | "teal" | "blue" | "amber";

export interface Agent {
	id: string;
	name: string;
	description: string;
	avatar?: string;
	icon: AgentIcon;
	tone: AgentTone;
	instructions: string;
	skills: { id: string; name: string }[];
	/** Knowledge (VECTOR) and toolbox resources, identified by catalog type and id. */
	mcp: MCPConfig[];
	members: string[];
}
