import { useParams } from "react-router";
import { AgentDetailView } from "@semoss/chat";

/**
 * The agent the address names.
 *
 * @component
 */
export const AgentDetailPage = () => {
	const { agentId = "" } = useParams();
	return <AgentDetailView workspaceId={agentId} />;
};
