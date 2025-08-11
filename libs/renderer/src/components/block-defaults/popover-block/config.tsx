import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { PopoverBlock, type PopoverBlockDef } from "./PopoverBlock";

export const config: BlockConfig<PopoverBlockDef> = {
	widget: "popover",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: {},
		designMode: true,
		targetId: null,

		open: "",
		openTrigger: "click",
	},
	listeners: {
		onOpen: {
			type: "sync",
			order: [],
		},
		onClose: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		header: [],
		content: [],
	},
	render: PopoverBlock,
};
