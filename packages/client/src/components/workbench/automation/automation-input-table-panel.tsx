import { Table2Icon } from "lucide-react";
import {
	type AutomationInputTablePreview,
	RunNodeDataViewer,
	useAutomationWorkbenchContext,
} from "@semoss/automation";
import { P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchComponent,
	type WorkbenchPanelConfig,
} from "@semoss/workbench";

/** Only authorized result references are persisted; table rows stay out of layout snapshots. */
export interface AutomationInputTablePanelConfig {
	appId: string;
	nodeId: string;
	runId: string;
	label: string;
	startedAt: string;
	insightId?: string;
	frame?: AutomationInputTablePreview["frame"];
	savedResult?: AutomationInputTablePreview["savedResult"];
}

const AutomationInputTablePanel: WorkbenchComponent = ({ id }) => {
	const { config } = useWorkbenchPanel<AutomationInputTablePanelConfig>(id);
	const { onOpenOutput } = useAutomationWorkbenchContext();
	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col gap-3 p-4">
			<P className="shrink-0 text-muted-foreground text-xs">
				{config.label}: read-only output from {config.startedAt}.
				Current upstream data may differ.
			</P>
			<div className="min-h-0 min-w-0 flex-1">
				<RunNodeDataViewer
					key={`${config.appId}:${config.runId}:${config.nodeId}`}
					appId={config.appId}
					insightId={config.insightId}
					frame={config.frame}
					savedResult={config.savedResult}
					outputPreview=""
					onOutputPopout={onOpenOutput}
					fillHeight
				/>
			</div>
		</div>
	);
};

/** A closable read-only tab for one immutable upstream run output. */
export const AUTOMATION_INPUT_TABLE_PANEL: WorkbenchPanelConfig<AutomationInputTablePanelConfig> =
	{
		name: "Input table",
		icon: ({ className }) => <Table2Icon className={className} />,
		canClose: true,
		canRename: false,
		mount: "keepAlive",
		matches: (left, right) =>
			left.appId === right.appId &&
			left.runId === right.runId &&
			left.nodeId === right.nodeId,
		content: AutomationInputTablePanel,
	};
