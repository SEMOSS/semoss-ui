import { useCallback, useRef } from "react";
import type { MainContext } from "@/app/main.context";
import type { InsightActions } from "@/lib/pixel";
import type { Agent } from "@/types/agent";
import {
	AgentCreatedError,
	type AgentDraft,
	createAgent,
	updateAgent,
} from "./save-agent";

/** Map the supported settings to the workspace reactor's parameter names. */
function toAgentDraft(agent: Agent, skillIds?: string[]): AgentDraft {
	return {
		name: agent.name,
		description: agent.role,
		systemPrompt: agent.instructions,
		mcp: agent.mcp,
		skillIds: skillIds ?? agent.skillIds,
		subagents: agent.members.map((workspaceId) => ({ workspaceId })),
		// Depth 0 disables all delegation; depth 1 allows only the lead to spawn.
		maxSubagentDepth: agent.spawn ? agent.depth : Math.min(agent.depth, 1),
		maxSubagentsPerRun: agent.concurrency,
	};
}

interface UseSaveAgentOptions {
	/** Active insight used for ordered workspace mutations. */
	actions: InsightActions;
	/** Loaded agents, retained as a fallback for existing context consumers. */
	agents: Agent[];
	/** Refreshes the catalog after the entire save succeeds. */
	onSaved: () => void;
}

/** Save agent settings, preserving the server id across a failed creation follow-up. */
export function useSaveAgent({
	actions,
	agents,
	onSaved,
}: UseSaveAgentOptions): MainContext["saveAgent"] {
	const createdIds = useRef(new Map<string, string>());

	return useCallback(
		async (agent, skillIds, workspaceId) => {
			const draft = toAgentDraft(agent, skillIds);
			const existingId =
				workspaceId ??
				createdIds.current.get(agent.id) ??
				agents.find((candidate) => candidate.id === agent.id)?.id;
			let savedId: string;
			if (existingId) {
				await updateAgent(actions, existingId, draft);
				savedId = existingId;
			} else {
				try {
					savedId = await createAgent(actions, draft);
					createdIds.current.set(agent.id, savedId);
				} catch (cause) {
					if (cause instanceof AgentCreatedError) {
						createdIds.current.set(agent.id, cause.workspaceId);
					}
					throw cause;
				}
			}

			onSaved();
			return savedId;
		},
		[actions, agents, onSaved],
	);
}
