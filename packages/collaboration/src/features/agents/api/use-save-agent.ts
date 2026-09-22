import { useCallback, useRef } from "react";
import type { MainContext } from "@/app/main.context";
import type { InsightActions } from "@/lib/pixel";
import type { Agent } from "@/types/agent";
import { deleteAgentImage, uploadAgentImage } from "./agent-image";
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
		async (agent, skillIds, workspaceId, image) => {
			const draft = toAgentDraft(agent, skillIds);
			const existingId =
				workspaceId ??
				createdIds.current.get(agent.id) ??
				agents.find((candidate) => candidate.id === agent.id)?.id;
			// Apply creation defaults on the first save and any partial-save retry.
			// Omit hidden limits on existing agents so their saved config is preserved.
			if (
				!existingId ||
				(!workspaceId && createdIds.current.has(agent.id))
			) {
				draft.maxSubagentDepth = 1;
				draft.maxSpawnsPerTurn = 4;
				draft.maxTurns = 40;
			}
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

			try {
				if (image) await uploadAgentImage(savedId, image);
				else if (image === null) await deleteAgentImage(savedId);
			} catch (cause) {
				throw new Error(
					`The agent was saved, but its photo could not be ${image ? "uploaded" : "removed"}. Retry saving to finish. ${cause instanceof Error ? cause.message : "Please try again."}`,
					{ cause },
				);
			}

			onSaved();
			return savedId;
		},
		[actions, agents, onSaved],
	);
}
