import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { TextBlock, type TextBlockDef } from "./TextBlock";

export const DefaultStyles: CSSProperties = {
	padding: "4px",
	whiteSpace: "pre-line",
	textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
	widget: "text",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		showPlaceholder: false,
		style: DefaultStyles,
		text: "Hello world",
		isStreaming: false,
		show: "true",
		loading: false,
		loadType: "Skeleton",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: TextBlock,
};
