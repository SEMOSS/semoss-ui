import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button, Spinner } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { EmptyView } from "@/components/common/empty-view";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { NewRoomStart } from "@/features/rooms/components/new-room-start";
import { agentNewPath, newRoomPath } from "@/lib/workspace-paths";

/** Selects an agent and hosts the focused first-message experience. */
export function NewRoomPage() {
	const { agents } = useMain();
	const [searchParams] = useSearchParams();
	const [lastLoadedAgent, setLastLoadedAgent] =
		useState<WorkspaceAgent | null>(null);
	const requestedAgentId = searchParams.get("agentId") ?? "";
	const agentId = requestedAgentId || agents[0]?.id || "";
	const { agent, isLoading, error, refresh } = useAgentDetail(agentId);
	const selectedAgent =
		agent?.workspace_id === agentId ? agent : lastLoadedAgent;
	const isAgentReady =
		Boolean(agent && agent.workspace_id === agentId) &&
		!isLoading &&
		!error;
	const agentLoadError =
		error ??
		(!isLoading && !agent
			? new Error(
					"The requested agent is unavailable or no longer exists.",
				)
			: null);

	useEffect(() => {
		if (agent?.workspace_id === agentId) setLastLoadedAgent(agent);
	}, [agent, agentId]);

	if (!agentId) {
		return (
			<main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
				<EmptyView
					title="No agents yet"
					action={
						<Button asChild>
							<Link to={agentNewPath()}>
								<Plus aria-hidden="true" />
								Add agent
							</Link>
						</Button>
					}
				>
					Add an agent before starting a conversation.
				</EmptyView>
			</main>
		);
	}

	if (isLoading && !selectedAgent) {
		return (
			<main className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-background p-4">
				<Spinner aria-label="Loading agent" />
			</main>
		);
	}

	if ((error || !agent) && !selectedAgent) {
		return (
			<main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
				<EmptyView
					title={
						error ? "Could not load this agent" : "Agent not found"
					}
					action={
						<div className="flex flex-col gap-2 sm:flex-row">
							{error && (
								<Button type="button" onClick={refresh}>
									Try again
								</Button>
							)}
							<Button asChild variant="outline">
								<Link to={newRoomPath()}>
									Choose another agent
								</Link>
							</Button>
						</div>
					}
				>
					{error?.message ??
						"The requested agent is unavailable or no longer exists."}
				</EmptyView>
			</main>
		);
	}

	if (!selectedAgent) return null;

	return (
		<NewRoomStart
			agent={selectedAgent}
			agents={agents}
			selectedAgentId={agentId}
			isAgentReady={isAgentReady}
			agentError={agentLoadError}
			onRetryAgent={refresh}
		/>
	);
}
