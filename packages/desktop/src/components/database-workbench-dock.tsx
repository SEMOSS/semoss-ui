import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import {
	Workbench,
	WorkbenchCommandMenuButton,
	WorkbenchResetButton,
} from "@semoss/workbench";
import { DATABASE_QUERY_PANEL } from "./database-query-panel";
import { DATABASE_RESULTS_PANEL } from "./database-results-panel";
import { DATABASE_SCHEMA_PANEL } from "./database-schema-panel";
import { DATABASE_WORKBENCH_PANELS } from "./database-workbench.constants";
import { useDesktopDatabaseWorkbench } from "./database-workbench.context";

export const DATABASE_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[DATABASE_WORKBENCH_PANELS.SCHEMA]: DATABASE_SCHEMA_PANEL,
	[DATABASE_WORKBENCH_PANELS.QUERY]: DATABASE_QUERY_PANEL,
	[DATABASE_WORKBENCH_PANELS.RESULTS]: DATABASE_RESULTS_PANEL,
};

export const DATABASE_WORKBENCH_LAYOUT: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [DATABASE_WORKBENCH_PANELS.QUERY],
		activeId: DATABASE_WORKBENCH_PANELS.QUERY,
	},
	panels: {
		[DATABASE_WORKBENCH_PANELS.SCHEMA]: {
			id: DATABASE_WORKBENCH_PANELS.SCHEMA,
			type: DATABASE_WORKBENCH_PANELS.SCHEMA,
			name: "Columns",
			canClose: false,
		},
		[DATABASE_WORKBENCH_PANELS.QUERY]: {
			id: DATABASE_WORKBENCH_PANELS.QUERY,
			type: DATABASE_WORKBENCH_PANELS.QUERY,
			name: "Query",
			canClose: false,
			config: { initialQuery: "", queryNumber: 1 },
		},
	},
	borders: {
		left: {
			panelIds: [DATABASE_WORKBENCH_PANELS.SCHEMA],
			activeId: DATABASE_WORKBENCH_PANELS.SCHEMA,
			size: 300,
		},
		bottom: {
			panelIds: [],
			activeId: null,
			size: 300,
		},
	},
};

export const DatabaseWorkbenchDock = () => {
	const handlePanelClosed = useDesktopDatabaseWorkbench(
		(state) => state.handlePanelClosed,
	);
	return (
		<div className="relative h-full min-h-0 w-full bg-background">
			<Workbench
				snapshot={DATABASE_WORKBENCH_LAYOUT}
				onPanelClose={handlePanelClosed}
				borderSlots={{
					left: {
						after: (
							<>
								<WorkbenchCommandMenuButton />
								<WorkbenchResetButton
									snapshot={DATABASE_WORKBENCH_LAYOUT}
								/>
							</>
						),
					},
				}}
			/>
		</div>
	);
};
