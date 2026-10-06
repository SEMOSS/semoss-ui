import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { Button, Spinner } from "@semoss/ui/next";
import { AgentProvider } from "@/app/agent.context";
import { EmptyView } from "@/components/common/empty-view";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import type { Agent as ShowcaseAgent } from "@/types/agent";

interface SelectedAgentProps {
	/** Agent identity and display name while its configuration loads. */
	source: ShowcaseAgent;
	/** Conversation content, or the nested route when omitted. */
	children?: ReactNode;
}

/**
 * Loads the selected agent's full configuration and provides it to the agent
 * routes.
 *
 * @param source - The list entry for the agent, used for its id and for
 * labelling while the full record loads.
 */
export function SelectedAgent({ source, children }: SelectedAgentProps) {
	const { agent, isLoading, error, refresh } = useAgentDetail(source.id);

	if (error) {
		return (
			<EmptyView
				title={`Could not load ${source.name}`}
				action={
					<Button type="button" onClick={refresh}>
						Try again
					</Button>
				}
			>
				{error.message}
			</EmptyView>
		);
	}

	if (!agent) {
		return (
			<div className="flex h-full w-full items-center justify-center py-4">
				<Spinner aria-label={`Loading ${source.name}`} />
			</div>
		);
	}

	return (
		<AgentProvider value={{ agent, agentId: source.id, refresh }}>
			{children ?? <Outlet />}
			{isLoading && (
				<span className="sr-only">Refreshing {agent.name}</span>
			)}
		</AgentProvider>
	);
}
