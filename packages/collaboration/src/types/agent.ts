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

/** Fields edited outside the profile form's direct controls. */
type AgentFieldUpdate =
	| { key: "skills"; value: Agent["skills"] }
	| { key: "mcp"; value: Agent["mcp"] }
	| { key: "members"; value: Agent["members"] };

/** Updates one collection field of an editable agent draft. */
export type AgentFieldUpdater = (update: AgentFieldUpdate) => void;
