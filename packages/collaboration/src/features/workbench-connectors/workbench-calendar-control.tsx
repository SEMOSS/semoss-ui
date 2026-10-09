import type {
	CalendarAgendaViewControls,
	ConnectorAccount,
} from "@semoss/connectors";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchConnectorControlActions } from "./workbench-connector-control-actions";
import { useWorkbenchConnectorNavigation } from "./workbench-connector-navigation.context";

/** Provider-specific live actions are transient and never enter a layout snapshot. */
export interface WorkbenchCalendarPanelValue {
	controls: Partial<Record<ConnectorAccount, CalendarAgendaViewControls>>;
}

/** Calendar actions in desktop panel chrome or the compact agenda's toolbar. */
export function WorkbenchCalendarControl({ id }: WorkbenchPanelProps) {
	const { value } = useWorkbenchPanel<
		Record<string, never>,
		WorkbenchCalendarPanelValue
	>(id);
	const { providers } = useWorkbenchConnectorNavigation();
	const controls = value?.controls[providers.calendar];
	if (!controls) return null;

	return (
		<WorkbenchConnectorControlActions
			refresh={controls.refresh}
			isRefreshing={controls.isRefreshing}
			href={controls.calendarUrl}
			appName={controls.appName}
		/>
	);
}
