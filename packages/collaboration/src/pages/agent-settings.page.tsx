import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { useSkills } from "@/features/agents/api/use-skills";
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
		description: "",
		icon: "compass",
		tone: "green",
		instructions:
			"Be clear, concise, and ask before taking external actions.",
		skills: [],
		mcp: [],
		members: [],
	}));
	// The list row from MyProjects carries only an id and a name. Editing from it
	// would send an empty description and system prompt to EditWorkspace, which
	// overwrites both unconditionally — so the full record is loaded first.
	const {
		agent: fetched,
		isLoading,
		error,
		refresh,
	} = useAgentDetail(agentId ?? "");
	const loaded = fetched?.workspace_id === agentId ? fetched : null;
	const skillsQuery = useSkills();
	// Keep existing attachments resolvable even when catalog access changes.
	const skills = [
		...(loaded?.skills ?? []).map(
			(skill) =>
				skillsQuery.skills.find((current) => current.id === skill.id) ??
				skill,
		),
		...skillsQuery.skills.filter(
			(skill) =>
				!loaded?.skills.some((current) => current.id === skill.id),
		),
	];

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
	if (!agent) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{error?.message ?? "The agent could not be loaded."}
				</AlertDescription>
				<Button type="button" variant="outline" onClick={refresh}>
					Try again
				</Button>
			</Alert>
		);
	}
	return (
		<AgentSettings
			key={agent.id}
			agent={agent}
			agents={agents}
			onClose={() => navigate(agentPath())}
			skillOptions={skills.map((skill) => ({
				name: skill.name,
				value: skill.id,
				detail: skills.some(
					(other) =>
						other.id !== skill.id && other.name === skill.name,
				)
					? skill.id
					: "",
			}))}
			isLoadingSkills={skillsQuery.isLoading}
			skillsError={skillsQuery.error}
			onRetrySkills={skillsQuery.refresh}
			onSave={async (saved, image) => {
				const ids = saved.skills.map((skill) => skill.id);
				if (
					ids.some((id) => !skills.some((skill) => skill.id === id))
				) {
					throw new Error(
						"A selected skill could not be found. Reload the skill catalog before saving.",
					);
				}
				await saveAgent(saved, agentId, image);
				navigate(agentPath());
			}}
		/>
	);
}
