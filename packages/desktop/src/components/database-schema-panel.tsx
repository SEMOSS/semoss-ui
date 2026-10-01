import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useWorkbenchControl } from "@semoss/workbench";
import { DatabaseColumnsRefreshControl } from "./database-columns-refresh-control";
import {
	DatabaseSchemaBrowser,
	DatabaseSchemaIcon,
} from "./database-schema-browser";
import { useDesktopDatabaseWorkbench } from "./database-workbench.context";

const DatabaseSchemaPanel: WorkbenchComponent = ({ id }) => {
	const mode = useDesktopDatabaseWorkbench((state) => state.mode);
	const structure = useDesktopDatabaseWorkbench(
		(state) => state.structure.data,
	);
	const status = useDesktopDatabaseWorkbench(
		(state) => state.structure.status,
	);
	const error = useDesktopDatabaseWorkbench((state) => state.structure.error);
	const addQueryPanel = useDesktopDatabaseWorkbench(
		(state) => state.addQueryPanel,
	);
	useWorkbenchControl(id, DatabaseColumnsRefreshControl);
	return (
		<DatabaseSchemaBrowser
			mode={mode}
			structure={structure}
			status={status}
			error={error}
			onCreateQuery={addQueryPanel}
		/>
	);
};

export const DATABASE_SCHEMA_PANEL: WorkbenchPanelConfig = {
	name: "Columns",
	helpText: "Database Structure",
	icon: ({ className }) => <DatabaseSchemaIcon className={className} />,
	canClose: false,
	canRename: false,
	content: DatabaseSchemaPanel,
	mount: "keepAlive",
};
