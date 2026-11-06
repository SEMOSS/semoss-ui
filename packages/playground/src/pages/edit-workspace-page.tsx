import { useParams } from "react-router";
import { AgentEditView } from "@semoss/chat";

/**
 * The editor for the agent the address names.
 *
 * @component
 */
export const EditWorkspacePage = () => {
	const { workspaceId = "" } = useParams<{ workspaceId: string }>();
	return <AgentEditView workspaceId={workspaceId} />;
};
