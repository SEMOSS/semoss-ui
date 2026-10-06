import {
	BookOpen,
	FolderOpen,
	Mail,
	ScrollText,
	Settings2,
	Wrench,
} from "lucide-react";
import type { RefObject } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ComposerPanelAction } from "@/features/rooms/components/room-composer.types";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	chatPanelTarget,
	restoreWorkPane,
	workPanelTarget,
} from "./work-pane-layout";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { useWorkThread } from "./work-thread-context";
/** All entry points select an existing panel before revealing the dock. */
export function useWorkPanelActions(
	returnFocusTarget?: RefObject<HTMLElement | null>,
): ComposerPanelAction[] {
	const workbench = useToolWorkbench();
	const { snapshot, setSettingsSection, conversationKind, onOpenPanel } =
		useWorkThread();
	const isChat = conversationKind === "chat";
	const open = (
		type: string,
		name: string,
		config?: Record<string, unknown>,
	) => {
		const layout = workbench.store.getState().layout;
		if (
			!isChat &&
			(type === WORK_PANEL_TYPES.CONTEXT ||
				type === WORK_PANEL_TYPES.EMAILS)
		)
			restoreWorkPane(layout, type);
		else
			layout.actions.selectPanel(type, config, {
				name,
				target: isChat
					? chatPanelTarget(layout)
					: workPanelTarget(layout),
			});
		if (onOpenPanel) onOpenPanel(returnFocusTarget?.current);
		else workbench.openWorkbench();
	};
	const actions: ComposerPanelAction[] = [
		{
			id: "compact",
			label: "Conversation usage",
			icon: Settings2,
			onSelect: () => {
				setSettingsSection?.("advanced");
				open(WORK_PANEL_TYPES.SETTINGS, "Settings");
			},
		},
		{
			id: "emails",
			label: "View emails",
			icon: Mail,
			onSelect: () => open(WORK_PANEL_TYPES.EMAILS, "Emails"),
		},
		{
			id: "settings",
			label: "Open Settings",
			icon: Settings2,
			onSelect: () => {
				setSettingsSection?.("chat");
				open(WORK_PANEL_TYPES.SETTINGS, "Settings");
			},
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
	return isChat
		? actions.filter((action) => action.id !== "emails")
		: actions;
}
