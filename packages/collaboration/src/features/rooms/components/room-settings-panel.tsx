import { Settings } from "lucide-react";
import { createElement, useCallback, useContext } from "react";
import { P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	useWorkbenchStoreApi,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { ToolWorkbenchFocusContext } from "../../tools/tool-workbench-focus.context";
import { RoomSettingsForm } from "./room-settings-form";
import { RoomSettingsPanelContext } from "./room-settings-panel.context";

export const ROOM_SETTINGS_PANEL_TYPE = "collaboration-room-settings";

/** Edit the current room in a retained dock tab using the shared settings form. */
export function RoomSettingsPanel({ id }: WorkbenchPanelProps) {
	const settings = useContext(RoomSettingsPanelContext);
	const focusWorkbench = useContext(ToolWorkbenchFocusContext);
	const { close } = useWorkbenchPanel(id);
	const store = useWorkbenchStoreApi();
	const handleSubmittingChange = useCallback(
		(isSubmitting: boolean): void => {
			store
				.getState()
				.layout.actions.updatePanel(id, { canClose: !isSubmitting });
		},
		[id, store],
	);
	if (!settings)
		return <P className="p-4">Open a room to change its settings.</P>;
	const handleCancel = (): void => {
		close();
		requestAnimationFrame(() => focusWorkbench?.());
	};
	return (
		<section
			aria-label="Room settings"
			className="flex size-full min-h-0 min-w-0 flex-col overflow-hidden p-4"
		>
			<RoomSettingsForm
				{...settings}
				onCancel={handleCancel}
				onSubmittingChange={handleSubmittingChange}
			/>
		</section>
	);
}

const ROOM_SETTINGS_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) =>
		createElement(Settings, { className, "aria-hidden": true }),
	content: RoomSettingsPanel,
	mount: "keepAlive",
	canRename: false,
	canSplitTab: false,
	matches: () => true,
};

/** Register once with the host; opening Settings selects the existing room tab. */
export const ROOM_SETTINGS_PANEL_COMPONENTS = {
	[ROOM_SETTINGS_PANEL_TYPE]: ROOM_SETTINGS_PANEL,
};
