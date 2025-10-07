import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { RatingsBlock, type RatingsBlockDef } from "./RatingsBlock";

// export the config for the block
export const config: BlockConfig<RatingsBlockDef> = {
	widget: "ratings",
	type: BLOCK_TYPE_ACTION,
	data: {
		size: "small",
		type: "star",
		max: 5,
		value: 2,
	},
	listeners: {
		onChange: {
			type: "sync",
			order: [],
		},
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
	},
	render: RatingsBlock,
};
