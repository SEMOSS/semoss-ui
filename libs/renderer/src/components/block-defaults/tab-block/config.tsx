import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { TabBlock, type TabBlockDef } from "./TabBlock";

export const config: BlockConfig<TabBlockDef> = {
	widget: "tab",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: {},
		activeTab: 0,
		tabOrientation: "horizontal" as "horizontal" | "vertical",
		showTabIndicator: true,
		textColor: "primary" as "primary" | "secondary" | "inherit",
		indicatorColor: "primary" as "primary" | "secondary",
		variant: "standard" as "standard" | "fullWidth" | "scrollable",
		tabLabels: ["Tab 1", "Tab 2"],
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		onChange: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		"1": [],
		"2": [],
	},
	render: TabBlock,
};
