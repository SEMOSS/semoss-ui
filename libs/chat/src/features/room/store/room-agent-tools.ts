import { getWorkspace } from "@semoss/sdk";
import type { MCPConfig } from "../../../types";
import { NEW_INSIGHT_ID } from "../../tools/mcp/mcp-constants";
import { NO_AGENT_TOOLS } from "./room-snapshot";

/** What the agent tools need from their room. */
export interface RoomAgentToolsDependencies {
	/** The insight the room runs in, which the agent is read in. */
	getInsightId: () => string;
	/** The agent the room's options name, or null for none. */
	getAgentId: () => string | null;
	/** Keep the agent's tools in the room's `agentTools`. */
	write: (agentTools: readonly MCPConfig[]) => void;
}

/**
 * The tools and knowledge the room's agent brings: read from the agent when
 * it changes, and dropped when a read lands for an agent the room no longer
 * has.
 */
export class RoomAgentTools {
	/** What the agent tools read from and write to their room. */
	private readonly deps: RoomAgentToolsDependencies;

	/** The agent whose tools the room holds, or null for none. */
	private agentId: string | null = null;

	/** Bumped with every change of the tools, so a read that lands late is dropped. */
	private version = 0;

	/**
	 * @param deps - What the agent tools need from their room.
	 */
	constructor(deps: RoomAgentToolsDependencies) {
		this.deps = deps;
	}

	/**
	 * Take the tools an agent brings, read elsewhere, so the room does not
	 * read them again.
	 *
	 * @param agentId - The agent, or null for none.
	 * @param agentTools - Its tools and knowledge.
	 */
	set = (agentId: string | null, agentTools: readonly MCPConfig[]): void => {
		this.agentId = agentId || null;
		this.version += 1;
		this.deps.write(agentTools.length > 0 ? agentTools : NO_AGENT_TOOLS);
	};

	/**
	 * Follow a change of the room's agent: drop the last agent's tools and
	 * read the new one's. A room with no insight yet, a new chat's draft,
	 * reads nothing; its owner hands it the agent's tools.
	 */
	follow = (): void => {
		const agentId = this.deps.getAgentId();
		if (agentId === this.agentId) return;
		this.set(agentId, NO_AGENT_TOOLS);
		const insightId = this.deps.getInsightId();
		if (!agentId || insightId === NEW_INSIGHT_ID) return;
		const version = this.version;
		getWorkspace(insightId, agentId).then(
			(workspace) => {
				if (version === this.version) {
					this.set(agentId, workspace.mcp);
				}
			},
			(error: unknown) => {
				console.warn("Failed to read the room's agent:", error);
			},
		);
	};
}
