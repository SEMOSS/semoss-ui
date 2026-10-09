import type { ConnectorAccount, MailboxViewControls } from "@semoss/connectors";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchConnectorControlActions } from "./workbench-connector-control-actions";
import { useWorkbenchConnectorNavigation } from "./workbench-connector-navigation.context";

/** Live viewer callbacks are kept per account and never enter a layout snapshot. */
export interface WorkbenchEmailsPanelValue {
	controls: Partial<Record<ConnectorAccount, MailboxViewControls>>;
}

/** Email actions in desktop panel chrome or the compact viewer's toolbar. */
export function WorkbenchEmailsControl({ id }: WorkbenchPanelProps) {
	const { value } = useWorkbenchPanel<
		Record<string, never>,
		WorkbenchEmailsPanelValue
	>(id);
	const { providers } = useWorkbenchConnectorNavigation();
	const controls = value?.controls[providers.emails];
	if (!controls) return null;

	return (
		<WorkbenchConnectorControlActions
			refresh={controls.refresh}
			isRefreshing={controls.isRefreshing}
			appName={controls.appName}
		/>
	);
}
