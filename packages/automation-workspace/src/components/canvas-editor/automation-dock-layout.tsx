import { type ReactNode, useCallback, useState } from "react";
import "flexlayout-react/style/light.css";
import "@semoss/shared/flexlayout.css";
import { FlexLayout } from "@semoss/shared";

const WORKFLOW_TAB_ID = "AUTOMATION_WORKFLOW";
const CONFIG_TAB_ID = "AUTOMATION_CONFIG";
const CANVAS_TAB_ID = "AUTOMATION_CANVAS";
const INSPECTOR_TAB_ID = "AUTOMATION_INSPECTOR";
const HISTORY_TAB_ID = "AUTOMATION_HISTORY";

const buildWorkbenchModel = (): FlexLayout.IJsonModel => ({
	global: {
		tabEnableRename: false,
		tabSetEnableDeleteWhenEmpty: true,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				id: "AUTOMATION_LEFT_DOCK",
				weight: 22,
				minWidth: 240,
				children: [
					{
						id: WORKFLOW_TAB_ID,
						type: "tab",
						name: "Workflow",
						component: "workflow",
						enableClose: false,
						enableRename: false,
					},
					{
						id: CONFIG_TAB_ID,
						type: "tab",
						name: "Variables",
						component: "config",
						enableClose: false,
						enableRename: false,
					},
					{
						id: HISTORY_TAB_ID,
						type: "tab",
						name: "History",
						component: "history",
						enableClose: false,
						enableRename: false,
					},
				],
			},
			{
				type: "tabset",
				id: "AUTOMATION_CANVAS_TABSET",
				weight: 54,
				minHeight: 360,
				enableDeleteWhenEmpty: false,
				children: [
					{
						id: CANVAS_TAB_ID,
						type: "tab",
						name: "Workflow Canvas",
						component: "canvas",
						enableClose: false,
						enableDrag: false,
						enableRename: false,
					},
				],
			},
			{
				type: "tabset",
				id: "AUTOMATION_RIGHT_DOCK",
				weight: 24,
				minWidth: 300,
				children: [
					{
						id: INSPECTOR_TAB_ID,
						type: "tab",
						name: "Inspector",
						component: "inspector",
						enableClose: false,
						enableRename: false,
					},
				],
			},
		],
	},
});

interface AutomationDockLayoutProps {
	workflow: ReactNode;
	config: ReactNode;
	canvas: ReactNode;
	inspector: ReactNode;
	history: ReactNode;
}

export function AutomationDockLayout({
	workflow,
	config,
	canvas,
	inspector,
	history,
}: AutomationDockLayoutProps) {
	const [model] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(buildWorkbenchModel()),
	);

	const factory = useCallback(
		(node: FlexLayout.TabNode): ReactNode => {
			switch (node.getComponent()) {
				case "workflow":
					return workflow;
				case "config":
					return config;
				case "canvas":
					return canvas;
				case "inspector":
					return inspector;
				case "history":
					return history;
				default:
					return null;
			}
		},
		[canvas, config, history, inspector, workflow],
	);

	return (
		<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
			<FlexLayout.Layout model={model} factory={factory} />
		</div>
	);
}
