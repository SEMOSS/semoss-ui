import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SwitchBlock, type SwitchBlockDef } from "./SwitchBlock";

export const DefaultStyles: CSSProperties = {
	width: "fit-content",
};

// export the config for the block
export const config: BlockConfig<SwitchBlockDef> = {
	widget: "switch",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: DefaultStyles,
		label: "Toggle Switch",
		value: false,
		disabled: false,
		color: "primary",
		size: "medium",
		helperText: "",
		required: false,
		labelPlacement: "end",
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
	render: SwitchBlock,
};
