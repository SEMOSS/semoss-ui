import { useParams } from "react-router";
import { AgentEdit } from "@/features/agents/agent-edit";

/** Edit the agent the route names. */
export const AgentEditPage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	return <AgentEdit workspaceId={workspaceId} />;
};
