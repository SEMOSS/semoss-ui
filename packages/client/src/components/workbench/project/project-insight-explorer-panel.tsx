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

const terminalInsightId = (value: unknown): string | null =>
	typeof value === "string" && value ? value : null;

/**
 * The "Insight" file explorer panel. Each terminal panel owns its own insight,
 * so this binds to the active terminal panel via an adopting
 * InsightProvider — `mode.INSIGHT` browsing and uploads then land in the same
 * workspace the terminal sees. `destroyOnUnmount` is off so this pane never
 * drops the insight the terminal owns. Shows a spinner until a terminal insight
 * is ready.
 */
const ProjectInsightExplorerPanel: WorkbenchComponent<
	Record<string, unknown>,
	FileExplorerApi
> = ({ id, setValue }) => {
	// Each terminal publishes its insight on its own scratch value. Follow the
	// most recently selected terminal, regardless of where that panel was moved.
	const insightId = useWorkbench((state) => {
		const findInsightId = (panelIds: string[]): string | null => {
			for (let i = panelIds.length - 1; i >= 0; i--) {
				const terminalPanelId = panelIds[i];
				if (
					state.layout.panels[terminalPanelId]?.type !==
					WORKBENCH_COMPONENTS.PROJECT_TERMINAL
				) {
					continue;
				}

				const insightId = terminalInsightId(
					state.layout.values[terminalPanelId],
				);
				if (insightId) {
					return insightId;
				}
			}

			return null;
		};

		const selectedInsightId = findInsightId(state.layout.selection.history);
		if (selectedInsightId) {
			return selectedInsightId;
		}

		return findInsightId(state.layout.openPanelIds);
	});

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
