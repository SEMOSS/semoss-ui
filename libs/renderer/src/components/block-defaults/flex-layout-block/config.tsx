import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { FlexLayoutBlock, type FlexLayoutBlockDef } from "./FlexLayoutBlock";

export const DefaultStyles: CSSProperties = {
	display: "flex",
	height: "100%",
	width: "100%",
};

export const config: BlockConfig<FlexLayoutBlockDef> = {
	widget: "flex-layout",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: DefaultStyles,
		appId: "",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: FlexLayoutBlock,
};
