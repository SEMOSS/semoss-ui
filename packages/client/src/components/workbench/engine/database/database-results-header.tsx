import { Table2Icon } from "lucide-react";
import type { WorkbenchComponent } from "@semoss/workbench";
import { useWorkbench, useWorkbenchPanel } from "@semoss/workbench";
import { useDatabaseWorkbench } from "@/hooks/use-database-workbench";
import type { DatabaseQueryResultsConfig } from "./database-query-results-panel";
import { DatabaseTransactionOutcomeIcon } from "./database-transaction-outcome-icon";

/**
 * Reactive header for a results panel: derives its title from the paired
 * query panel's live name, so renaming a query renames its results without
 * any rename listener. Results from a script run in one transaction get an
 * icon to the left whose tooltip says what the transaction left in the database.
 */
export const DatabaseResultsHeader: WorkbenchComponent = ({ id }) => {
	const { config } = useWorkbenchPanel<DatabaseQueryResultsConfig>(id);

	const sourcePanel = config.sourcePanel;
	const queryName = useWorkbench(
		(state) => state.layout.panels[sourcePanel]?.name,
	);
	const transaction = useDatabaseWorkbench((state) => {
		const result = state.results[sourcePanel];
		return result?.type === "BATCH" ? result.transaction : undefined;
	});

	return (
		<>
			{transaction && (
				<DatabaseTransactionOutcomeIcon transaction={transaction} />
			)}
			<Table2Icon size={13} className="flex-none" />
			<span className="min-w-0 truncate whitespace-nowrap">
				{`Results — ${queryName ?? "Query"}`}
			</span>
		</>
	);
};
