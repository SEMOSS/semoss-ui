import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { CheckboxBlock, type CheckboxBlockDef } from "./CheckboxBlock";

// export the config for the block
export const config: BlockConfig<CheckboxBlockDef> = {
	widget: "checkbox",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: {
			padding: "none",
		},
		label: "Example Checkbox",
		required: false,
		disabled: false,
		value: false,
		show: "true",
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
	render: CheckboxBlock,
};
