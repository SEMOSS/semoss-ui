import { SquareTerminalIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { InsightProvider, useInsight } from "@semoss/sdk/react";
import { TerminalConsole, TerminalProvider } from "@semoss/terminal";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { ProjectNewTerminalControl } from "./project-new-terminal-control";

/** The configuration used to retain the default Terminal N name. */
export interface ProjectTerminalConfig {
	terminalNumber?: number;
}

/**
 * Publishes this terminal panel's insight for the active terminal to adopt in
 * the Insight file explorer.
 */
const ProjectTerminalInsightReporter = ({
	onInsightChange,
}: {
	onInsightChange: (insightId: string | null) => void;
}) => {
	const { insightId } = useInsight();

	useEffect(() => {
		if (insightId) {
			onInsightChange(insightId);
		}
	}, [insightId, onInsightChange]);
	useEffect(() => () => onInsightChange(null), [onInsightChange]);

	return null;
};

/** One Pixel REPL session, owned by a single workbench terminal panel. */
const ProjectTerminalPanelContent: WorkbenchComponent<
	ProjectTerminalConfig,
	string | null
> = ({ id, setValue }) => {
	const { project } = useProject();
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;
	const onInsightChange = useCallback(
		(insightId: string | null) => setValueRef.current(insightId),
		[],
	);

	useWorkbenchControl(id, ProjectNewTerminalControl);

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<TerminalProvider location="panel">
				<ProjectTerminalInsightReporter
					onInsightChange={onInsightChange}
				/>
				<TerminalConsole projectId={project.project_id} />
			</TerminalProvider>
		</InsightProvider>
	);
};

/**
 * Blueprint for each project terminal. keepAlive is required because every
 * workbench tab is an independent live REPL session.
 */
export const PROJECT_TERMINAL_PANEL: WorkbenchPanelConfig<
	ProjectTerminalConfig,
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
