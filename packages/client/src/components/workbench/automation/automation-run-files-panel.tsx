import { FolderClockIcon } from "lucide-react";
import { useMemo } from "react";
import { useAutomationWorkbenchContext } from "@semoss/automation";
import { FileExplorerPane, getFilePanelType } from "@semoss/panels";
import { InsightProvider } from "@semoss/sdk/react";
import { type FileMode, useFileExplorer } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import {
	useWorkbench,
	type WorkbenchComponent,
	type WorkbenchPanelConfig,
	type WorkbenchPanelId,
} from "@semoss/workbench";

const RunFilesExplorer = ({
	id,
	insightId,
}: {
	id: WorkbenchPanelId;
	insightId: string;
}) => {
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const mode = useMemo<FileMode>(
		() => ({ type: "INSIGHT", insightId }),
		[insightId],
	);
	const explorer = useFileExplorer({
		mode,
		readOnly: true,
		onItemSelect: (item) => {
			layoutActions.selectPanel(
				getFilePanelType(item.path),
				{
					mode,
					name: item.name,
					path: item.path,
				},
				{ name: item.name },
			);
		},
	});

	return <FileExplorerPane id={id} explorer={explorer} />;
};

const EmptyRunFiles = ({ children }: { children: React.ReactNode }) => (
	<div className="flex size-full items-center justify-center bg-background p-6 text-center text-muted-foreground text-sm">
		{children}
	</div>
);

/**
 * Read-only view of the temporary Insight workspace owned by the selected run.
 * The execution service retains completed workspaces briefly for inspection and
 * remains solely responsible for destroying them.
 */
const AutomationRunFilesPanel: WorkbenchComponent = ({ id }) => {
	const { selectedRun, traceSnapshot } = useAutomationWorkbenchContext();
	const activeRun = traceSnapshot?.activeRun ?? null;
	const run =
		selectedRun ??
		(traceSnapshot?.running || activeRun?.executionInsightId
			? activeRun
			: null);
	const insightId = run?.executionInsightId;

	if (insightId) {
		return (
			<InsightProvider
				key={insightId}
				options={{ insightId }}
				destroyOnUnmount={false}
			>
				<RunFilesExplorer id={id} insightId={insightId} />
			</InsightProvider>
		);
	}

	if (run?.STATUS === "RUNNING" || traceSnapshot?.running) {
		return (
			<EmptyRunFiles>
				<span className="inline-flex items-center gap-2">
					<Spinner className="size-4" />
					Connecting to the run workspace…
				</span>
			</EmptyRunFiles>
		);
	}

	if (run) {
		return (
			<EmptyRunFiles>
				Run files are temporary and are no longer available. Node
				results remain available in Run details.
			</EmptyRunFiles>
		);
	}

	return (
		<EmptyRunFiles>
			Select an active or recently completed run to browse its temporary
			files.
		</EmptyRunFiles>
	);
};

/** Automation-owned panel blueprint; shared file panels remain unchanged. */
export const AUTOMATION_RUN_FILES_PANEL: WorkbenchPanelConfig = {
	name: "Run files",
	helpText: "Files in the selected active or recently completed run",
	icon: ({ className }) => <FolderClockIcon className={className} />,
	canClose: false,
	canRename: false,
	enableBorderHeader: false,
	mount: "keepAlive",
	content: AutomationRunFilesPanel,
};
