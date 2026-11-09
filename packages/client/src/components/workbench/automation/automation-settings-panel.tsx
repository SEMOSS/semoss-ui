import type { ComponentProps } from "react";
import type { WorkbenchComponent } from "@semoss/workbench";
import { ProjectDetailTabs } from "@/components/project/project-detail-tabs";

/** The project detail tabs the automation workbench's Settings panel shows. */
const SETTINGS_TABS: ComponentProps<typeof ProjectDetailTabs>["tabs"] = [
	{ name: "Overview", component: "project-overview" },
	{
		name: "MCP",
		component: "mcp-usage",
		restrict: ["OWNER", "EDIT", "READ_ONLY"],
	},
	{
		name: "Activity Log",
		component: "activity",
		restrict: ["OWNER", "EDIT", "READ_ONLY"],
	},
	{ name: "GitHub", component: "github", restrict: ["OWNER"] },
	{
		name: "Access Control",
		component: "access-control",
		restrict: ["OWNER", "EDIT"],
	},
	{ name: "Audit Trail", component: "audit", restrict: ["OWNER"] },
	{
		name: "Settings",
		component: "settings",
		restrict: ["OWNER", "EDIT"],
	},
	{ name: "SMSS", component: "smss", restrict: ["OWNER"] },
];

/** The automation workbench's Settings panel: the project's detail tabs. */
export const AutomationSettingsPanel: WorkbenchComponent = () => (
	<ProjectDetailTabs tabs={SETTINGS_TABS} />
);
