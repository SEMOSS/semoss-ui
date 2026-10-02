import { LogsIcon } from "lucide-react";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { WorkspaceConsole } from "@/components/workspace/panels";
import { useProject } from "@/hooks";

const ProjectAppConsolePanelContent: WorkbenchComponent = () => {
	const { project } = useProject();

	return <WorkspaceConsole appId={project.project_id} />;
};

/** Live application logs for the active code project. */
export const PROJECT_APP_CONSOLE_PANEL: WorkbenchPanelConfig = {
	name: "Console",
	helpText: "Application Logs",
	icon: ({ className }) => <LogsIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ProjectAppConsolePanelContent,
};
