import { FlaskConicalIcon } from "lucide-react";
import { InsightProvider } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import { ProjectInsightExplorer } from "./project-insight-explorer";

/**
 * The "Insight" file explorer panel. Each terminal tab owns its own insight, so
 * this binds to the *active* terminal tab's insight via an adopting
 * InsightProvider — `mode.INSIGHT` browsing and uploads then land in the same
 * workspace the terminal sees. `destroyOnUnmount` is off so this pane never
 * drops the insight the terminal owns. Shows a spinner until a terminal insight
 * is ready.
 */
export const ProjectInsightExplorerPanel: WorkbenchComponent<
	Record<string, unknown>,
	FileExplorerApi
> = ({ id, setValue }) => {
	// the terminal panel publishes its active insightId on its scratch value
	const insightId = useWorkbench(
		(state) =>
			(state.layout.values[WORKBENCH_COMPONENTS.PROJECT_TERMINAL] as
				| string
				| null
				| undefined) ?? null,
	);

	if (!insightId) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-background">
				<Spinner className="size-4" />
			</div>
		);
	}

	return (
		<InsightProvider options={{ insightId }} destroyOnUnmount={false}>
			<ProjectInsightExplorer id={id} setValue={setValue} />
		</InsightProvider>
	);
};

/**
 * Blueprint for the insight file explorer. keepAlive: the tree's expansion
 * state survives tab switches.
 */
export const PROJECT_INSIGHT_EXPLORER_PANEL: WorkbenchPanelConfig<
	Record<string, unknown>,
	FileExplorerApi
> = {
	name: "Insight",
	helpText: "Insight File Explorer",
	icon: ({ className }) => <FlaskConicalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ProjectInsightExplorerPanel,
};
