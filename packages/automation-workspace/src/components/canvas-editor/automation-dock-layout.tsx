import { type ReactNode, useCallback, useState } from "react";
import "flexlayout-react/style/light.css";
import "@semoss/shared/flexlayout.css";
import { FlexLayout } from "@semoss/shared";

const WORKFLOW_TAB_ID = "AUTOMATION_WORKFLOW";
const GUIDANCE_TAB_ID = "AUTOMATION_GUIDANCE";
const CONFIG_TAB_ID = "AUTOMATION_CONFIG";
const CANVAS_TAB_ID = "AUTOMATION_CANVAS";
const INSPECTOR_TAB_ID = "AUTOMATION_INSPECTOR";
const VALIDATION_TAB_ID = "AUTOMATION_VALIDATION";
const TRACE_TAB_ID = "AUTOMATION_TRACE";
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
						id: GUIDANCE_TAB_ID,
						type: "tab",
						name: "Guidance",
						component: "guidance",
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
				],
			},
			{
				type: "row",
				id: "AUTOMATION_CENTER_DOCK",
				weight: 54,
				children: [
					{
						type: "tabset",
						id: "AUTOMATION_CANVAS_TABSET",
						weight: 70,
						minHeight: 360,
						children: [
							{
								id: CANVAS_TAB_ID,
								type: "tab",
								name: "Authoring canvas",
								component: "canvas",
								enableClose: false,
								enableDrag: false,
								enableRename: false,
							},
						],
					},
					{
						type: "tabset",
						id: "AUTOMATION_BOTTOM_DOCK",
						weight: 30,
						minHeight: 180,
						children: [
							{
								id: TRACE_TAB_ID,
								type: "tab",
								name: "Run trace",
								component: "trace",
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
						enableClose: true,
						enableRename: false,
					},
					{
						id: VALIDATION_TAB_ID,
						type: "tab",
						name: "Validation",
						component: "validation",
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
	guidance: ReactNode;
	config: ReactNode;
	canvas: ReactNode;
	inspector: ReactNode;
	validation: ReactNode;
	trace: ReactNode;
	history: ReactNode;
	onInspectorClose: () => void;
}

export function AutomationDockLayout({
	workflow,
	guidance,
	config,
	canvas,
	inspector,
	validation,
	trace,
	history,
	onInspectorClose,
}: AutomationDockLayoutProps) {
	const [model] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(buildWorkbenchModel()),
	);

	const factory = useCallback(
		(node: FlexLayout.TabNode): ReactNode => {
			switch (node.getComponent()) {
				case "workflow":
					return workflow;
				case "guidance":
					return guidance;
				case "config":
					return config;
				case "canvas":
					return canvas;
				case "inspector":
					return inspector;
				case "validation":
					return validation;
				case "trace":
					return trace;
				case "history":
					return history;
				default:
					return null;
			}
		},
		[
			canvas,
			config,
			guidance,
			history,
			inspector,
			trace,
			validation,
			workflow,
		],
	);

	const handleAction = useCallback(
		(action: FlexLayout.Action) => {
			if (
				action.type === FlexLayout.Actions.DELETE_TAB &&
				action.data.node === INSPECTOR_TAB_ID
			) {
				onInspectorClose();
				return undefined;
			}
			return action;
		},
		[onInspectorClose],
	);

	return (
		<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
			<FlexLayout.Layout
				model={model}
				factory={factory}
				onAction={handleAction}
			/>
		</div>
	);
}
