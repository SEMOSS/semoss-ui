import { useParams } from "react-router";
import { useMain } from "@/app/main.context";
import { SelectedAgent } from "@/components/layouts/selected-agent";
import { agentFromProjectRow } from "@/features/agents/utils/agent-from-workspace";
import { NotFoundPage } from "@/pages/not-found.page";

/**
 * Resolves the `:agentId` route segment to an agent and provides it to the
 * nested agent routes.
 */
export function AgentLayout() {
	const workspace = useMain();
	const { agentId } = useParams();

	if (!agentId) return <NotFoundPage title="Agent not found" />;

	// Membership of the loaded list is not required. A just-created agent, or a
	// link opened before the list lands, is still a real agent — GetWorkspace is
	// the authority, and SelectedAgent surfaces its "not found" for a bad id.
	const source =
		workspace.agents.find((candidate) => candidate.id === agentId) ??
		agentFromProjectRow({ project_id: agentId, project_name: "Agent" });

	return <SelectedAgent key={agentId} source={source} />;
}
