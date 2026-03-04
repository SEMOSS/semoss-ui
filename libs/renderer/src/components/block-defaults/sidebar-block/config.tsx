import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { SidebarBlock, type SidebarBlockDef } from "./SidebarBlock";

export const config: BlockConfig<SidebarBlockDef> = {
	widget: "sidebar",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		designMode: true, // Default to design mode when first dropped
		open: "", // Default to closed
		anchor: "left",
		style: {
			width: "240px",
			height: "100%",
		},
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		postProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
	},
	render: SidebarBlock,
};
