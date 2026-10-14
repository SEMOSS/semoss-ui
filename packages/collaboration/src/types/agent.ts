import type { MCPConfig } from "@semoss/shared";

export interface Agent {
	id: string;
	name: string;
	description: string;
	avatar?: string;
	instructions: string;
	skills: { id: string; name: string }[];
	/** Knowledge (VECTOR) and toolbox resources, identified by catalog type and id. */
	mcp: MCPConfig[];
	members: string[];
}
