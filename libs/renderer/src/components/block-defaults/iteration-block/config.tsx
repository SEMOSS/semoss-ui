import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { IterationBlock, type IterationBlockDef } from "./IterationBlock";

// export the config for the block
export const config: BlockConfig<IterationBlockDef> = {
	widget: "iteration",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: {},
		source: "",
		child: null,
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		children: [],
	},
	render: IterationBlock,
};
