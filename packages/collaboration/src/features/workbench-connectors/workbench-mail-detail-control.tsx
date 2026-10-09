import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchConnectorControlActions } from "./workbench-connector-control-actions";
import type {
	WorkbenchConnectorItemConfig,
	WorkbenchConnectorItemValue,
} from "./workbench-connector-navigation.context";

/** Open the exact email represented by this tab, once its reader supplies a URL. */
export function WorkbenchMailDetailControl({ id }: WorkbenchPanelProps) {
	const { config, value } = useWorkbenchPanel<
		WorkbenchConnectorItemConfig,
		WorkbenchConnectorItemValue
	>(id);
	const controls = value?.kind === "mail" ? value.controls : undefined;
	if (
		!controls?.webUrl ||
		controls.provider !== config.provider ||
		controls.kind !== config.kind ||
		controls.itemId !== config.itemId ||
		value?.kind !== "mail" ||
		value.selection.kind !== controls.kind ||
		value.selection.id !== controls.itemId
	)
		return null;

	return (
		<WorkbenchConnectorControlActions
			href={controls.webUrl}
			appName={controls.appName}
		/>
	);
}
