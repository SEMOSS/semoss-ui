import { TerminalConsolePanel } from "@semoss/terminal";
import { useProject } from "@/hooks";

export interface ProjectTerminalPanelProps {
	/**
	 * Called with the insightId of the active terminal tab (or `null` when none
	 * is ready). The code workbench passes this so its "Insight" file explorer
	 * binds to the same insight the user runs commands in.
	 */
	onActiveInsightChange?: (insightId: string | null) => void;
}

/**
 * Multi-tab Pixel REPL for a project workbench. The tab logic lives in
 * `@semoss/terminal` (`TerminalConsolePanel`) so it is shared with other
 * embedders; each tab is its own project-scoped insight.
 */
export const ProjectTerminalPanel: React.FC<ProjectTerminalPanelProps> = ({
	onActiveInsightChange,
}) => {
	const { project } = useProject();

	return (
		<TerminalConsolePanel
			appId={project.project_id}
			onActiveInsightChange={onActiveInsightChange}
		/>
	);
};
