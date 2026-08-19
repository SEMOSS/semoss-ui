import { type ReactNode, useCallback, useState } from "react";
import { FlexLayout } from "@semoss/shared";
import "flexlayout-react/style/light.css";
import "@semoss/shared/flexlayout.css";

const CANVAS_TAB_ID = "AUTOMATION_CANVAS";

const buildWorkbenchModel = (): FlexLayout.IJsonModel => ({
	global: {
		tabEnableRename: false,
		tabEnableDrag: true,
		tabSetEnableDrag: true,
		tabSetEnableDrop: true,
		tabSetEnableDeleteWhenEmpty: false,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				weight: 100,
				minWidth: 360,
				minHeight: 360,
				enableDeleteWhenEmpty: false,
				enableDrag: true,
				enableDrop: true,
				enableMaximize: false,
				enableTabStrip: false,
				children: [
					{
						id: CANVAS_TAB_ID,
						type: "tab",
						name: "Editor",
						component: "canvas",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
				],
			},
		],
	},
});

interface AutomationDockLayoutProps {
	canvas: ReactNode;
}

/** Renders the editor canvas; host workspace owns Inspector, Files, Chat, and Run details tabs. */
export function AutomationDockLayout({ canvas }: AutomationDockLayoutProps) {
	const [model] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(buildWorkbenchModel()),
	);
	const factory = useCallback(
		(node: FlexLayout.TabNode): ReactNode =>
			node.getComponent() === "canvas" ? canvas : null,
		[canvas],
	);

	return (
		<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
			<FlexLayout.Layout model={model} factory={factory} />
		</div>
	);
}
