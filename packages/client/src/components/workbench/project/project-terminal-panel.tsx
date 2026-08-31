import { SquareTerminalIcon } from "lucide-react";
import { TerminalConsolePanel } from "@semoss/terminal";
import { useProject } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
	WorkbenchPanelParams,
} from "@/stores/workbench";

interface ProjectTerminalPanelProps {
	/**
	 * Called with the insightId of the active terminal tab (or `null` when none
	 * is ready). The workbench blueprint publishes it through the panel's
	 * scratch value so the "Insight" file explorer binds to the same insight
	 * the user runs commands in.
	 */
	onActiveInsightChange?: (insightId: string | null) => void;
}

/**
 * Multi-tab Pixel REPL for a project workbench. The tab logic lives in
 * `@semoss/terminal` (`TerminalConsolePanel`) so it is shared with other
 * embedders; each tab is its own project-scoped insight.
 */
const ProjectTerminalPanel: React.FC<ProjectTerminalPanelProps> = ({
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

/** No config of its own; its scratch value is the active tab's insightId. */
const ProjectTerminalPanelContent: WorkbenchComponent<
	WorkbenchPanelParams,
	string | null
> = ({ setValue }) => (
	<div className="h-full w-full overflow-hidden">
		<ProjectTerminalPanel
			onActiveInsightChange={(insightId) => setValue(insightId)}
		/>
	</div>
);

/**
 * Blueprint for the project terminal. keepAlive is required: the live REPL
 * sessions live in the mounted panel. The active tab's insightId is published
 * on the panel's scratch value for the insight explorer.
 */
export const PROJECT_TERMINAL_PANEL: WorkbenchPanelConfig<
	WorkbenchPanelParams,
	string | null
> = {
	name: "Terminal",
	helpText: "Terminal",
	icon: ({ className }) => <SquareTerminalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ProjectTerminalPanelContent,
};
