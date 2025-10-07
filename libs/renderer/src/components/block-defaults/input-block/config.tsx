import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { InputBlock, type InputBlockDef } from "./InputBlock";

export const DefaultStyles: CSSProperties = {
	width: "100%",
	padding: "4px",
};

// export the config for the block
export const config: BlockConfig<InputBlockDef> = {
	widget: "input",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: DefaultStyles,
		value: "",
		label: "Example Input",
		hint: "",
		type: "text",
		rows: 1,
		multiline: false,
		disabled: false,
		required: false,
		loading: false,
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
	render: InputBlock,
};
