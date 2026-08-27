import { MonitorXIcon, TvMinimalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoreApi } from "zustand";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useEngine, useWorkbenchCommands, useWorkbenchStoreApi } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import {
	createDatabaseWorkbenchStore,
	type DatabaseWorkbenchState,
} from "@/stores/workbench/database";
import { Workbench } from "../../core";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
import { WorkbenchCommandMenuButton } from "../../core/workbench-command-menu-button";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { DATABASE_COLUMNS_PANEL } from "./database-columns-panel";
import { DATABASE_QUERY_PANEL } from "./database-query-panel";
import { DATABASE_RESULTS_PANEL } from "./database-query-results-panel";

/** The seeded query panel every admin query workbench starts with. */
const INITIAL_QUERY_PANEL_ID = "database-query-1";

/**
 * The default arrangement: columns on the left and an empty bottom border kept
 * as the docking target for query results. No file/settings/assistant panels —
 * system databases have no engine asset space or engine settings, and a
 * privileged-SQL assistant is a separate decision.
 */
const ADMIN_QUERY_LAYOUT: WorkbenchLayout = {
	version: 1,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [INITIAL_QUERY_PANEL_ID],
		activeId: INITIAL_QUERY_PANEL_ID,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[INITIAL_QUERY_PANEL_ID]: {
			id: INITIAL_QUERY_PANEL_ID,
			type: WORKBENCH_COMPONENTS.DATABASE_QUERY,
			name: "Query",
			canClose: false,
			config: { initialQuery: "", queryNumber: 1 },
		},
		[WORKBENCH_PANEL_RECORDS.DATABASE_COLUMNS.id]:
			WORKBENCH_PANEL_RECORDS.DATABASE_COLUMNS,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.DATABASE_COLUMNS],
			activeId: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
			size: 300,
		},
		bottom: { panelIds: [], activeId: null, size: 300 },
	},
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const ADMIN_QUERY_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: DATABASE_COLUMNS_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_QUERY]: DATABASE_QUERY_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: DATABASE_RESULTS_PANEL,
};

/**
 * Query workbench for privileged admin access to internal system databases.
 * The database workbench panels over a store initialized in ADMIN_SQL mode,
 * so structure and queries run AdminGetSystemDatabaseSchema / AdminSqlQuery
 * against the selected system database (provided through a synthetic
 * EngineContext by the admin query page). ADMIN_SQL queries are always SQL
 * and CSV export is unavailable.
 */
export const AdminQueryWorkbench: React.FC = () => {
	const storeApi = useWorkbenchStoreApi();
	const { engine } = useEngine();
	const [isMaximized, setIsMaximized] = useState(false);

	// created once per mount and attached before the panels first render
	const [databaseStore] = useState<StoreApi<DatabaseWorkbenchState>>(() => {
		const store = createDatabaseWorkbenchStore({ workbench: storeApi });
		storeApi.getState().layout.actions.attachDomainStore(store);
		return store;
	});

	// initialize the workbench in admin mode
	useEffect(() => {
		void databaseStore.getState().initialize(engine.engine_id, "ADMIN_SQL");
	}, [engine.engine_id, databaseStore]);

	useWorkbenchCommands([
		{
			id: "workbench.database-columns.open",
			category: "View",
			label: "Open Columns",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
				);
			},
		},
		{
			id: "workbench.database-query.open",
			category: "Database",
			label: "New Query",
			handler: () => {
				databaseStore.getState().addQueryPanel("");
			},
		},
	]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div
				className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
					isMaximized
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0"
				}`}
			/>
			<div
				className={`overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out ${
					isMaximized ? "fixed inset-4 z-50" : "h-full w-full"
				}`}
			>
				<Workbench
					layout={ADMIN_QUERY_LAYOUT}
					components={ADMIN_QUERY_COMPONENTS}
					onPanelClose={(pid, record) =>
						databaseStore.getState().handlePanelClosed(pid, record)
					}
					borderSlots={{
						left: {
							after: (
								<>
									<WorkbenchCommandMenuButton />
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={
													isMaximized
														? "Minimize"
														: "Maximize"
												}
												data-testid="adminQueryWorkbench-maximize-toggle"
												onClick={() => {
													setIsMaximized(
														!isMaximized,
													);
												}}
												className={cn(
													WORKBENCH_STYLES.chromeButton,
													isMaximized
														? WORKBENCH_STYLES.chromeButtonActive
														: WORKBENCH_STYLES.chromeButtonInactive,
												)}
											>
												{isMaximized ? (
													<MonitorXIcon
														className={
															WORKBENCH_STYLES.chromeIcon
														}
													/>
												) : (
													<TvMinimalIcon
														className={
															WORKBENCH_STYLES.chromeIcon
														}
													/>
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent side="right">
											{isMaximized
												? "Minimize"
												: "Maximize"}
										</TooltipContent>
									</Tooltip>
								</>
							),
						},
					}}
				/>
			</div>
		</div>
	);
};
