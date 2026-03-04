import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SliderBlock, type SliderBlockDef } from "./SliderBlock";

// export the config for the block
export const config: BlockConfig<SliderBlockDef> = {
	widget: "slider",
	type: BLOCK_TYPE_INPUT,
	data: {
		type: "continuous",
		style: {
			color: "primary",
		},
		marks: [],
		steps: 1,
		value: 0,
		min: 0,
		max: 100,
		size: "300px",
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
	slots: {},
	render: SliderBlock,
};
