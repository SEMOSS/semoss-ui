import { TestTubeDiagonalIcon } from "lucide-react";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { AppTestingPanel } from "@/features/app-testing/app-testing-panel";
import { useProject } from "@/hooks";

const CodeAppTestingPanelContent: WorkbenchComponent = () => {
	const { project } = useProject();
	return (
		<AppTestingPanel key={project.project_id} appId={project.project_id} />
	);
};

/**
 * Blueprint for the Testing panel. keepAlive: an in-progress recording or run
 * survives switching to another sidebar tab.
 */
export const PROJECT_APP_TESTING_PANEL: WorkbenchPanelConfig<
	Record<string, never>
> = {
	name: "Testing",
	helpText: "Record and run app tests",
	icon: ({ className }) => <TestTubeDiagonalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: CodeAppTestingPanelContent,
};
