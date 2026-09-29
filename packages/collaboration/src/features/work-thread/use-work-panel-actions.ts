import {
	BookOpen,
	FolderOpen,
	ScrollText,
	Settings2,
	Wrench,
} from "lucide-react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ComposerPanelAction } from "@/features/rooms/components/room-composer.types";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { useWorkThread } from "./work-thread-context";
/** All entry points select an existing panel before revealing the dock. */
export function useWorkPanelActions(): ComposerPanelAction[] {
	const workbench = useToolWorkbench();
	const { snapshot } = useWorkThread();
	const open = (
		type: string,
		name: string,
		config?: Record<string, unknown>,
	) => {
		workbench.store
			.getState()
			.layout.actions.selectPanel(type, config, { name });
		workbench.openWorkbench();
	};
	return [
		{
			id: "settings",
			label: "Open Settings",
			icon: Settings2,
			onSelect: () => open(WORK_PANEL_TYPES.SETTINGS, "Settings"),
		},
		{
			id: "context",
			label: "Update context",
			icon: BookOpen,
			onSelect: () => open(WORK_PANEL_TYPES.CONTEXT, "Context"),
		},
		{
			id: "files",
			label: "Browse files",
			icon: FolderOpen,
			disabled: !snapshot.isReady,
			onSelect: () =>
				open(FILE_PANEL_TYPES.FILE_EXPLORER, "Files", {
					mode: { type: "INSIGHT", insightId: workbench.insightId },
				}),
		},
		{
			id: "tools",
			label: "View tools",
			icon: Wrench,
			onSelect: () => open(WORK_PANEL_TYPES.TOOLS, "Tools"),
		},
		{
			id: "activity",
			label: "View activity",
			icon: ScrollText,
			onSelect: () => open(WORK_PANEL_TYPES.ACTIVITY, "Activity"),
		},
	];
}
