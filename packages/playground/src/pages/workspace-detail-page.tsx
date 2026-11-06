import { useParams } from "react-router";
import { AgentDetailView } from "@semoss/chat";

/**
 * The agent the address names.
 *
 * @component
 */
export const WorkspaceDetailPage = () => {
	const { workspaceId = "" } = useParams<{ workspaceId: string }>();
	return <AgentDetailView workspaceId={workspaceId} />;
};
