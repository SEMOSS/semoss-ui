import { useParams } from "react-router";
import { AgentDetail } from "@/features/agents/agent-detail";

/** The agent the route names. */
export const AgentDetailPage = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	return <AgentDetail workspaceId={workspaceId} />;
};
