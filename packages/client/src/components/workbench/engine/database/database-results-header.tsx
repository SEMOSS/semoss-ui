import { Table2Icon } from "lucide-react";
import type { WorkbenchChrome } from "@semoss/workbench";
import { useWorkbench } from "@semoss/workbench";
import type { DatabaseQueryResultsConfig } from "./database-query-results-panel";

/**
 * Reactive header for a results panel: derives its title from the paired
 * query panel's live name, so renaming a query renames its results without
 * any rename listener.
 */
export const DatabaseResultsHeader: WorkbenchChrome<
	DatabaseQueryResultsConfig
> = ({ config }) => {
	const sourcePanel = config.sourcePanel;
	const queryName = useWorkbench(
		(state) => state.layout.panels[sourcePanel]?.name,
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
