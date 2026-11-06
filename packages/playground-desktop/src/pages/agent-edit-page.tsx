import { useParams } from "react-router";
import { AgentEditView } from "@semoss/chat";

/**
 * The editor for the agent the address names.
 *
 * @component
 */
export const AgentEditPage = () => {
	const { agentId = "" } = useParams();
	return <AgentEditView workspaceId={agentId} />;
};
