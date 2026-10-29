import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useProject } from "@/hooks";
import type { TerminalConfig } from "../terminal/terminal-panel";
import {
	TERMINAL_PANEL,
	TerminalPanelContent,
} from "../terminal/terminal-panel";

/** A terminal whose insight opens in the workbench's project. */
const ProjectTerminalPanelContent: WorkbenchComponent = ({ id }) => {
	const { project } = useProject();

	return <TerminalPanelContent id={id} projectId={project.project_id} />;
};

/**
 * Blueprint for each project terminal: the shared terminal, run in the
 * project. Project workbenches register it under `PROJECT_TERMINAL`, which is
 * also the type the Insight file explorer follows.
 */
export const PROJECT_TERMINAL_PANEL: WorkbenchPanelConfig<
	TerminalConfig,
	string | null
> = {
	...TERMINAL_PANEL,
	content: ProjectTerminalPanelContent,
};
