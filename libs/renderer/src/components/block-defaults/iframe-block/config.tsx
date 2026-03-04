import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { IframeBlock, type IframeBlockDef } from "./IframeBlock";

// export the config for the block
export const config: BlockConfig<IframeBlockDef> = {
	widget: "iframe",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {},
		src: "",
		title: "",
		enableFrameInteractions: true,
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: IframeBlock,
};
