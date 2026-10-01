import { Table2Icon } from "lucide-react";
import type { WorkbenchComponent } from "@semoss/workbench";
import { useWorkbench, useWorkbenchPanel } from "@semoss/workbench";
import type { DatabaseQueryResultsConfig } from "./database-results-panel";

export const DatabaseResultsHeader: WorkbenchComponent = ({ id }) => {
	const { config } = useWorkbenchPanel<DatabaseQueryResultsConfig>(id);
	const queryName = useWorkbench(
		(state) => state.layout.panels[config.sourcePanel]?.name,
	);
	return (
		<>
			<Table2Icon size={13} className="flex-none" />
			<span className="min-w-0 truncate whitespace-nowrap">
				{`Results — ${queryName ?? "Query"}`}
			</span>
		</>
	);
};
