import { RailItem } from "./rail-item";
import { useWorkbench } from "./use-workbench";
import { WorkbenchPanelIcon } from "./workbench-panel-icon";

/**
 * The Workspace's rail icons as the chat has them, and the place to start a
 * host's own (`ChatConfig.components.WorkbenchRail`): Files, Settings, the
 * activity log, and each connector viewer the chat can show now.
 */
export const DefaultWorkbenchRail = () => {
	const { panels } = useWorkbench();

	return panels.map((panel) => (
		<RailItem
			key={panel.id}
			label={panel.label}
			icon={
				<WorkbenchPanelIcon panel={panel} className="size-4 shrink-0" />
			}
			onOpen={panel.onOpen}
			isDisabled={panel.isDisabled}
			isLoading={panel.isLoading}
			panel={{ type: panel.panelType, config: panel.panelConfig }}
		/>
	));
};
