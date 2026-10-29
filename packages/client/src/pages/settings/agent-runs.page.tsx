import { Navigate } from "react-router";
import { AgentRuns } from "@/features/agent-runs/agent-runs";
import { useSettings } from "@/hooks/useSettings";

/** Mount the agent runs reader only while Settings is in admin mode. */
export const AgentRunsPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? <AgentRuns /> : <Navigate to="/settings" replace />;
};
