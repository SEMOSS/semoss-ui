import { Outlet, useParams } from "react-router";
import { Button, Spinner } from "@semoss/ui/next";
import { AgentProvider } from "@/app/agent.context";
import { useMain } from "@/app/main.context";
import { EmptyView } from "@/components/common/empty-view";
import { SelectedAgent } from "@/components/layouts/selected-agent";
import type { Agent } from "@/features/agents/types/agent";
import { agentFromProjectRow } from "@/features/agents/utils/agent-from-workspace";
import { useRoomWorkspaceId } from "@/features/rooms/api/use-room-workspace-id";
import { NotFoundPage } from "@/pages/not-found.page";

const unassignedRoomAgent: Agent = {
	name: "Assistant",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};

/**
 * Resolves the agent from either an agent route or a room's persisted workspace
 * and provides it to the nested route.
 */
export function AgentLayout() {
	const workspace = useMain();
	const { agentId: routeAgentId, roomId } = useParams();
	const listedAgentId = roomId
		? workspace.sessions.find((session) => session.id === roomId)
				?.agentId || undefined
		: undefined;
	const shouldResolveRoom = Boolean(
		roomId && !routeAgentId && !listedAgentId,
	);
	const roomWorkspace = useRoomWorkspaceId(roomId ?? "", shouldResolveRoom);
	const agentId = routeAgentId ?? listedAgentId ?? roomWorkspace.workspaceId;

	if (shouldResolveRoom && roomWorkspace.error) {
		return (
			<EmptyView
				title="Could not open room"
				action={
					<Button type="button" onClick={roomWorkspace.refresh}>
						Try again
					</Button>
				}
			>
				{roomWorkspace.error.message}
			</EmptyView>
		);
	}

	if (roomWorkspace.isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center py-4">
				<Spinner aria-label="Loading room" />
			</div>
		);
	}

	if (!agentId) {
		if (roomId) {
			return (
				<AgentProvider
					value={{
						agent: unassignedRoomAgent,
						agentId: "",
						refresh: roomWorkspace.refresh,
					}}
				>
					<Outlet />
				</AgentProvider>
			);
		}

		return <NotFoundPage />;
	}

	// Membership of the loaded list is not required. A just-created agent, or a
	// link opened before the list lands, is still a real agent — GetWorkspace is
	// the authority, and SelectedAgent surfaces its "not found" for a bad id.
	const source =
		workspace.agents.find((candidate) => candidate.id === agentId) ??
		agentFromProjectRow({ project_id: agentId, project_name: "Agent" });

	return <SelectedAgent key={agentId} source={source} />;
}
