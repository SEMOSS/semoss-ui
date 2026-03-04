import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { AccordionBlock, type AccordionBlockDef } from "./AccordionBlock";

export const config: BlockConfig<AccordionBlockDef> = {
	widget: "accordion",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: {},
		triggerBgColor: "",
		contentBgColor: "",
		showExpandIcon: true,
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		header: [],
		content: [],
	},
	render: AccordionBlock,
};
