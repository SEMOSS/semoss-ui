import { Table2Icon } from "lucide-react";
import { Spinner } from "@semoss/ui/next";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useWorkbenchPanel } from "@semoss/workbench";
import { DatabaseResultsHeader } from "./database-results-header";
import { DatabaseResultsView } from "./database-results-view";
import { useDesktopDatabaseWorkbench } from "./database-workbench.context";

export interface DatabaseQueryResultsConfig {
	sourcePanel: string;
}

const DatabaseResultsPanel: WorkbenchComponent = ({ id }) => {
	const { config } = useWorkbenchPanel<DatabaseQueryResultsConfig>(id);
	const result = useDesktopDatabaseWorkbench(
		(state) => state.results[config.sourcePanel] ?? null,
	);
	const isRunning = useDesktopDatabaseWorkbench(
		(state) => state.runningPanels[config.sourcePanel] ?? false,
	);
	if (isRunning) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner />
			</div>
		);
	}
	return <DatabaseResultsView result={result} />;
};

export const DATABASE_RESULTS_PANEL: WorkbenchPanelConfig<DatabaseQueryResultsConfig> =
	{
		name: "Results",
		icon: ({ className }) => <Table2Icon className={className} />,
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.sourcePanel === b.sourcePanel,
		header: DatabaseResultsHeader,
		content: DatabaseResultsPanel,
	};
