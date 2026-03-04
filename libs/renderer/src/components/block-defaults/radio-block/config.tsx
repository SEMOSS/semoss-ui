import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { RadioBlock, type RadioBlockDef } from "./RadioBlock";

export const config: BlockConfig<RadioBlockDef> = {
	widget: "radio",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: {
			padding: "4px",
		},
		value: "yes",
		label: "Radio Group",
		options: [
			{ label: "Yes", value: "yes" },
			{ label: "No", value: "no" },
		],
		size: "medium",
		direction: "row",
		color: "primary",
		labelPlacement: "end",
		required: false,
		disabled: false,
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		onChange: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
	},
	render: RadioBlock,
};
