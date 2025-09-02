import { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { DividerBlock, type DividerBlockDef } from "./DividerBlock";

// export the config for the block
export const config: BlockConfig<DividerBlockDef> = {
	widget: "divider",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {},
		variant: "fullWidth",
		orientation: "horizontal",
		textAlign: "center",
		flexItem: false,
		light: false,
		text: "",
		showText: false,
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: DividerBlock,
};
