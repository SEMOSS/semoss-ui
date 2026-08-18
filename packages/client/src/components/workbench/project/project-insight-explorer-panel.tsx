import { InsightProvider } from "@semoss/sdk/react";
import { FileExplorer } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";

export interface ProjectInsightExplorerPanelProps {
	/**
	 * insightId of the active terminal tab, or `null` before one is ready.
	 * Supplied by the owning workbench from `ProjectTerminalPanel`'s
	 * `onActiveInsightChange`.
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
