import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { ButtonBlock, type ButtonBlockDef } from "./ButtonBlock";

// export the config for the block
export const config: BlockConfig<ButtonBlockDef> = {
	widget: "button",
	type: BLOCK_TYPE_ACTION,
	data: {
		style: {},
		label: "Submit",
		loading: false,
		disabled: false,
		variant: "contained",
		color: "primary",
		show: "true",
		type: "button",
	},
	listeners: {
		onClick: {
			type: "sync",
			order: [],
		},
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: ButtonBlock,
};
