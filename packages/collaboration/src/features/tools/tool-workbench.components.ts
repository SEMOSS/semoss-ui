import { Bot, Hammer } from "lucide-react";
import { createElement } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { RunInspector } from "@/features/runs/components/run-inspector";
import { WORKBENCH_CALENDAR_PANEL } from "@/features/workbench-connectors/workbench-calendar-panel";
import {
	WORKBENCH_CALENDAR_EVENT_PANEL,
	WORKBENCH_CALENDAR_FULL_PANEL,
	WORKBENCH_EMAIL_DETAIL_PANEL,
} from "@/features/workbench-connectors/workbench-connector-detail-panel";
import { WORKBENCH_EMAILS_PANEL } from "@/features/workbench-connectors/workbench-emails-panel";
import { ToolPanel } from "./components/tool-panel";
import {
	CALENDAR_EVENT_PANEL_TYPE,
	CALENDAR_FULL_PANEL_TYPE,
	CALENDAR_PANEL_TYPE,
	EMAIL_DETAIL_PANEL_TYPE,
	EMAILS_PANEL_TYPE,
	RUN_PANEL_TYPE,
	TOOL_PANEL_TYPE,
} from "./tool-workbench.constants";
import type { ToolPanelConfig } from "./types/tool-workbench";

const TOOL_PANEL = {
	name: "Tool",
	icon: ({ className }) =>
		createElement(Hammer, { "aria-hidden": true, className }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.toolId === b.toolId,
	content: ToolPanel,
} satisfies import("@semoss/workbench").WorkbenchPanelConfig<ToolPanelConfig>;

const RUN_PANEL = {
	name: "Agent run",
	icon: ({ className }) =>
		createElement(Bot, { "aria-hidden": true, className }),
	canRename: false,
	matches: (a, b) => a.runId === b.runId,
	content: RunInspector,
} satisfies import("@semoss/workbench").WorkbenchPanelConfig<{ runId: string }>;

export const TOOL_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[EMAILS_PANEL_TYPE]: WORKBENCH_EMAILS_PANEL,
	[CALENDAR_PANEL_TYPE]: WORKBENCH_CALENDAR_PANEL,
	[EMAIL_DETAIL_PANEL_TYPE]: WORKBENCH_EMAIL_DETAIL_PANEL,
	[CALENDAR_EVENT_PANEL_TYPE]: WORKBENCH_CALENDAR_EVENT_PANEL,
	[CALENDAR_FULL_PANEL_TYPE]: WORKBENCH_CALENDAR_FULL_PANEL,
	[RUN_PANEL_TYPE]: RUN_PANEL,
	[TOOL_PANEL_TYPE]: TOOL_PANEL,
};
