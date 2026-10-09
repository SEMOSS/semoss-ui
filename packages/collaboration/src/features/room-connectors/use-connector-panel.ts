import { useCallback } from "react";
import type {
	ConnectorViewerControls,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { useInsight } from "@semoss/sdk/react";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	type WorkbenchPanel,
} from "@semoss/workbench";
import { ConnectorPanelControls } from "./connector-panel-controls";
import type { ConnectorPanelValue } from "./room-connectors.types";
import { useRoomConnectorHost } from "./use-room-connector-host";

/** Share control publication without putting connector policy in the dock. */
export function useConnectorPanel<Config>(id: string): {
	panel: WorkbenchPanel<Config, ConnectorPanelValue>;
	host: ConnectorViewerProps;
	isReady: boolean;
} {
	const panel = useWorkbenchPanel<Config, ConnectorPanelValue>(id);
	const { setValue, isVisible } = panel;
	const isCompact = useWorkbench((state) => state.layout.isMobileLayout);
	const host = useRoomConnectorHost();
	const { isReady } = useInsight();
	const publish = useCallback(
		(controls: ConnectorViewerControls) => {
			if (!isVisible) return;
			setValue((previous) => ({ ...previous, controls }));
		},
		[isVisible, setValue],
	);
	useWorkbenchControl(id, isCompact ? null : ConnectorPanelControls);
	return {
		panel,
		host: {
			...host,
			isVisible,
			onControlsChange: isCompact ? undefined : publish,
		},
		isReady,
	};
}
