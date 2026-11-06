import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { CONNECTOR_PANEL_COMPONENTS } from "../connectors/components/connector-viewer-panels";
import { ROOM_PANEL_COMPONENTS } from "../features/workbench/panels/room-panel.components";
import { CHAT_FILE_PANEL_COMPONENTS } from "../panels/file-panels";

/** The Workspace panels a host composes, for tests of the dock. */
export const TEST_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	...CHAT_FILE_PANEL_COMPONENTS,
	...ROOM_PANEL_COMPONENTS,
	...CONNECTOR_PANEL_COMPONENTS,
};
