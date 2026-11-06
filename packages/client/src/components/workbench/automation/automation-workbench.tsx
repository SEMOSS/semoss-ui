import { observer } from "mobx-react-lite";
import { useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { WorkbenchProvider } from "@semoss/workbench";
import { ShareAppDialog } from "@/components/ui/share/share-app-dialog";
import { useProject } from "@/hooks/use-project";
import {
	AUTOMATION_COMPONENTS,
	AutomationWorkbench,
} from "./automation-workbench-shell";

export { AutomationWorkbench };

/**
 * The automation project's workbench page: the workbench in its own insight
 * and dock, with the Share dialog its navbar opens.
 */
export const AutomationWorkbenchPage = observer(() => {
	const { project, catalog, permission } = useProject();
	const [shareOpen, setShareOpen] = useState(false);
	const readOnly = permission !== "OWNER" && permission !== "EDIT";
	return (
		<InsightProvider>
			<WorkbenchProvider components={AUTOMATION_COMPONENTS}>
				<AutomationWorkbench
					appId={project.project_id}
					permission={permission}
					readOnly={readOnly}
					projectName={
						project.project_display_name || project.project_name
					}
					catalogPath={catalog?.path}
					onShare={() => setShareOpen(true)}
				/>
				<ShareAppDialog
					appId={project.project_id}
					open={shareOpen}
					onOpenChange={setShareOpen}
				/>
			</WorkbenchProvider>
		</InsightProvider>
	);
});
