import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { MarkdownBlock, type MarkdownBlockDef } from "./MarkdownBlock";

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
	widget: "markdown",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {
			padding: "4px",
		},
		markdown: "**Hello world**",
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
	render: MarkdownBlock,
};
