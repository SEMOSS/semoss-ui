import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { LinkBlock, type LinkBlockDef } from "./LinkBlock";

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
	widget: "link",
	type: BLOCK_TYPE_ACTION,
	data: {
		style: {
			padding: "4px",
			whiteSpace: "pre-line",
			textOverflow: "ellipsis",
		},
		href: "",
		text: "Insert text",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: LinkBlock,
};
