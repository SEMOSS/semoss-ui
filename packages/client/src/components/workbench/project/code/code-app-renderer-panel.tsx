import { PanelsTopLeftIcon } from "lucide-react";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import {
	useWorkbenchControl,
	useWorkbenchEvent,
	useWorkbenchPanel,
} from "@semoss/workbench";
import { CodeRenderer } from "@/components/project";
import { useProject } from "@/hooks";
import { WORKBENCH_EVENTS } from "@/stores/workbench";
import { CodeAppRendererRefreshControl } from "./code-app-renderer-refresh-control";

/** The config an app-preview instance is opened with. */
export type CodeAppRendererConfig = Record<string, never>;

// `value` is the reload counter: the chrome control bumps it for a manual
// refresh — the panel cannot share a setter with a control, which draws in the
// chrome's subtree — and the panel bumps it itself when the app is published.
const CodeAppRendererPanelContent: WorkbenchComponent = ({ id }) => {
	const { value, setValue } = useWorkbenchPanel<
		CodeAppRendererConfig,
		number
	>(id);

	const { project } = useProject();

	useWorkbenchControl(id, CodeAppRendererRefreshControl);
	// A publish replaces what this iframe is showing, whoever did it. Before
	// this, the code workbench reached in and bumped the counter by a
	// hardcoded panel id, which only worked for the one publisher it knew.
	useWorkbenchEvent(WORKBENCH_EVENTS.APP_PUBLISHED, () => {
		setValue((count = 0) => count + 1);
	});

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
 * a publish remounts it through the `APP_PUBLISHED` event above.
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
