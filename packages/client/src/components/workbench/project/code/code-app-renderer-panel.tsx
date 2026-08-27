import { PanelsTopLeftIcon } from "lucide-react";
import { CodeRenderer } from "@/components/project";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { CodeAppRendererRefreshControl } from "./code-app-renderer-refresh-control";

/** The config an app-preview instance is opened with. */
export type CodeAppRendererConfig = Record<string, never>;

// `value` is the manual-refresh counter the chrome control bumps — the panel
// cannot share a setter with a control, which draws in the chrome's subtree
const CodeAppRendererPanelContent: WorkbenchComponent<
	CodeAppRendererConfig,
	number
> = ({ id, value }) => {
	const { project } = useProject();

	useWorkbenchControl(id, CodeAppRendererRefreshControl);

	return (
		<div className="h-full w-full overflow-hidden bg-background text-foreground">
			<CodeRenderer
				appId={project.project_id}
				key={`project.project_id--${value ?? 0}`}
			/>
		</div>
	);
};

/**
 * Blueprint for the app preview. keepAlive: the iframe survives tab switches;
 * publishes remount it by bumping `config.previewVersion` on the record.
 */
export const PROJECT_APP_RENDERER_PANEL: WorkbenchPanelConfig<
	CodeAppRendererConfig,
	number
> = {
	name: "App",
	helpText: "App Preview",
	icon: ({ className }) => <PanelsTopLeftIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: CodeAppRendererPanelContent,
};
