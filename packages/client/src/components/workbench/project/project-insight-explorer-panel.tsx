import { FlaskConicalIcon } from "lucide-react";
import { InsightProvider } from "@semoss/sdk/react";
import { FileExplorer } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

export interface ProjectInsightExplorerPanelProps {
	/**
	 * insightId of the active terminal tab, or `null` before one is ready.
	 * Published by `ProjectTerminalPanel` on the terminal panel's scratch
	 * value.
	 */
	insightId: string | null;
}

/**
 * The "Insight" file explorer. Each terminal tab owns its own insight, so this
 * binds to the *active* terminal tab's insight via an adopting InsightProvider —
 * `mode.INSIGHT` browsing and uploads then land in the same workspace the
 * terminal sees. `destroyOnUnmount` is off so this pane never drops the insight
 * the terminal owns. Shows a spinner until a terminal insight is ready.
 */
export const ProjectInsightExplorerPanel: React.FC<
	ProjectInsightExplorerPanelProps
> = ({ insightId }) => {
	if (!insightId) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-background">
				<Spinner className="size-4" />
			</div>
		);
	}

	return (
		<InsightProvider options={{ insightId }} destroyOnUnmount={false}>
			<FileExplorer mode={{ type: "INSIGHT" }} onItemSelect={() => {}} />
		</InsightProvider>
	);
};

const ProjectInsightExplorerPanelContent: React.FC = () => {
	// the terminal panel publishes its active insightId on its scratch value
	const insightId = useWorkbench(
		(state) =>
			(state.layout.values[WORKBENCH_COMPONENTS.PROJECT_TERMINAL] as
				| string
				| null
				| undefined) ?? null,
	);
	return <ProjectInsightExplorerPanel insightId={insightId} />;
};

/**
 * Blueprint for the insight file explorer. keepAlive: the tree's expansion
 * state survives tab switches.
 */
export const PROJECT_INSIGHT_EXPLORER_PANEL: WorkbenchPanelConfig = {
	name: "Insight",
	helpText: "Insight File Explorer",
	icon: ({ className }) => <FlaskConicalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ProjectInsightExplorerPanelContent,
};
