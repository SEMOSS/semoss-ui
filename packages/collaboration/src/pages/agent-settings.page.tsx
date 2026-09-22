import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import {
	listSkills,
	resolveSkillIds,
	type SkillOption,
} from "@/features/agents/api/list-skills";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { AgentSettings } from "@/features/agents/components/agent-settings-view";
import { agentFromWorkspace } from "@/features/agents/utils/agent-from-workspace";
import { agentPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";

/**
 * Create or configure an agent.
 *
 * Serves both `/agents/new` and `/agents/:agentId/settings`. When editing, the
 * agent is loaded in full rather than taken from the list row: `EditWorkspace`
 * overwrites the fields it is given, so editing from a partial record would
 * blank the agent's description and system prompt.
 */
export function AgentSettingsPage() {
	const { agents, saveAgent } = useMain();
	const { agentId } = useParams();
	const navigate = useNavigate();
	const [draft] = useState<Agent>(() => ({
		id: crypto.randomUUID(),
		name: "",
		role: "",
		type: "Individual",
		icon: "compass",
		tone: "green",
		workspace: "Conversation",
		instructions:
			"Be clear, concise, and ask before taking external actions.",
		skills: [],
		databases: [],
		dataProducts: [],
		members: [],
		depth: 0,
		concurrency: 2,
		spawn: false,
		triggers: [],
	}));
	// The list row from MyProjects carries only an id and a name. Editing from it
	// would send an empty description and system prompt to EditWorkspace, which
	// overwrites both unconditionally — so the full record is loaded first.
	const { agent: loaded, isLoading } = useAgentDetail(agentId ?? "");

	// The skills a user can attach, so the picker offers real skills and the
	// selection can be resolved back to the ids EditWorkspace expects.
	const { actions } = useInsight();
	const [skills, setSkills] = useState<SkillOption[]>([]);
	useEffect(() => {
		let cancelled = false;
		listSkills(actions)
			.then((available) => {
				if (!cancelled) setSkills(available);
			})
			.catch(() => {
				// A missing catalog must not block editing the rest of the agent.
				if (!cancelled) setSkills([]);
			});
		return () => {
			cancelled = true;
		};
	}, [actions]);

	if (agentId && isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center py-4">
				<Spinner aria-label="Loading agent settings" />
			</div>
		);
	}

	const agent = agentId
		? loaded
			? agentFromWorkspace(loaded)
			: undefined
		: draft;
	if (!agent) return null;
	return (
		<AgentSettings
			key={agent.id}
			agent={agent}
			agents={agents}
			onClose={() => navigate(agentPath(agentId))}
			skillOptions={skills.map((skill) => ({
				name: skill.name,
				detail: "",
			}))}
			onSave={async (saved) => {
				const { ids, unmatched } = resolveSkillIds(
					saved.skills,
					skills,
				);
				if (unmatched.length > 0) {
					toast.warning(
						`These skills are no longer available and were not attached: ${unmatched.join(", ")}`,
					);
				}
				// A new agent's draft id is replaced by the id the server assigns.
				const savedId = await saveAgent(saved, ids);
				navigate(agentPath(savedId));
			}}
		/>
	);
}
