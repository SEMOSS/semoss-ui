import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { HTMLBlock, type HTMLBlockDef } from "./HTMLBlock";

// export the config for the block
export const config: BlockConfig<HTMLBlockDef> = {
	widget: "html",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		html: "",
	},
	listeners: {},
	slots: {},
	render: HTMLBlock,
};
