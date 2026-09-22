import { Hammer } from "lucide-react";
import { createElement } from "react";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { ToolPanel } from "./components/tool-panel";
import { TOOL_PANEL_TYPE } from "./tool-workbench.constants";
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

export const TOOL_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[TOOL_PANEL_TYPE]: TOOL_PANEL,
};
