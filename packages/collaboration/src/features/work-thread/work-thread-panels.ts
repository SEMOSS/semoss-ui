import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import { TOOL_WORKBENCH_COMPONENTS } from "@/features/tools/tool-workbench.components";
import { WORK_ACTIVITY_PANEL } from "./work-activity-panel";
import { WORK_CONTEXT_PANEL } from "./work-context-dock-panel";
import { WORK_DRAFT_PANEL } from "./work-draft-panel";
import { WORK_EMAIL_PANEL } from "./work-email-panel";
import { WORK_EMAILS_PANEL } from "./work-emails-panel";
import { workPanelTarget } from "./work-pane-layout";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { WORK_SETTINGS_PANEL } from "./work-settings-panel";
import { WORK_TOOLS_PANEL } from "./work-tools-panel";

const WORK_THREAD_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	...TOOL_WORKBENCH_COMPONENTS,
	[WORK_PANEL_TYPES.EMAIL]: WORK_EMAIL_PANEL,
	[WORK_PANEL_TYPES.EMAILS]: WORK_EMAILS_PANEL,
	[WORK_PANEL_TYPES.DRAFT]: WORK_DRAFT_PANEL,
	[WORK_PANEL_TYPES.TOOLS]: WORK_TOOLS_PANEL,
	[WORK_PANEL_TYPES.ACTIVITY]: WORK_ACTIVITY_PANEL,
	[WORK_PANEL_TYPES.CONTEXT]: WORK_CONTEXT_PANEL,
	[WORK_PANEL_TYPES.SETTINGS]: WORK_SETTINGS_PANEL,
};
/** Open source history beside context; working tabs share the main dock. */
export function createWorkThreadLayout(): WorkbenchLayout {
	return {
		tree: {
			type: "row",
			id: "work-columns",
			size: 1,
			children: [
				{
					type: "tabset",
					id: "work-main",
					size: 75,
					panelIds: [WORK_PANEL_TYPES.EMAILS],
					activeId: WORK_PANEL_TYPES.EMAILS,
					enableMaximize: false,
				},
				{
					type: "tabset",
					id: "work-inspector",
					size: 25,
					panelIds: [WORK_PANEL_TYPES.CONTEXT],
					activeId: WORK_PANEL_TYPES.CONTEXT,
					enableMaximize: false,
				},
			],
		},
		panels: {
			[WORK_PANEL_TYPES.EMAILS]: {
				id: WORK_PANEL_TYPES.EMAILS,
				type: WORK_PANEL_TYPES.EMAILS,
				name: "Emails",
				canClose: false,
			},
			[WORK_PANEL_TYPES.CONTEXT]: {
				id: WORK_PANEL_TYPES.CONTEXT,
				type: WORK_PANEL_TYPES.CONTEXT,
				name: "Context",
				canClose: false,
			},
		},
		borders: {},
	};
}
export const WORK_THREAD_WORKBENCH = {
	defaultOpen: true,
	panelTarget: workPanelTarget,
	components: WORK_THREAD_COMPONENTS,
	createLayout: createWorkThreadLayout,
};
