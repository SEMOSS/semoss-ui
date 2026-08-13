import * as FlexLayout from "flexlayout-react";
import { type ReactNode, useCallback, useState } from "react";
import "flexlayout-react/style/light.css";
import "@semoss/shared/flexlayout.css";

const CANVAS_TAB_ID = "AUTOMATION_CANVAS";
const NODE_EDITOR_TAB_ID = "AUTOMATION_NODE_EDITOR";

const buildDockModel = (): FlexLayout.IJsonModel => ({
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
				id: "AUTOMATION_CANVAS_TABSET",
				weight: 65,
				children: [
					{
						id: CANVAS_TAB_ID,
						type: "tab",
						name: "Canvas",
						component: "canvas",
						enableClose: false,
						enableRename: false,
						enableDrag: true,
					},
				],
			},
			{
				type: "tabset",
				id: "AUTOMATION_NODE_EDITOR_TABSET",
				weight: 35,
				minWidth: 400,
				children: [
					{
						id: NODE_EDITOR_TAB_ID,
						type: "tab",
						name: "Node Editor",
						component: "node-editor",
						enableClose: true,
						enableRename: false,
						enableDrag: true,
					},
				],
			},
		],
	},
});

interface AutomationDockLayoutProps {
	canvas: ReactNode;
	isNodeEditorOpen: boolean;
	nodeEditor: ReactNode;
	onNodeEditorClose: () => void;
}

export function AutomationDockLayout({
	canvas,
	isNodeEditorOpen,
	nodeEditor,
	onNodeEditorClose,
}: AutomationDockLayoutProps) {
	const [model] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(buildDockModel()),
	);

	const factory = useCallback(
		(node: FlexLayout.TabNode): ReactNode => {
			if (node.getComponent() === "canvas") return canvas;
			if (node.getComponent() === "node-editor") return nodeEditor;
			return null;
		},
		[canvas, nodeEditor],
	);

	const handleAction = useCallback(
		(action: FlexLayout.Action) => {
			if (
				action.type === FlexLayout.Actions.DELETE_TAB &&
				action.data.node === NODE_EDITOR_TAB_ID
			) {
				onNodeEditorClose();
				return undefined;
			}
			return action;
		},
		[onNodeEditorClose],
	);

	if (!isNodeEditorOpen) return canvas;

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
