import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { PageBlock, type PageBlockDef } from "./PageBlock";

export const DefaultStyles: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	padding: "24px",
	gap: "8px",
	fontFamily: "roboto",
};

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
	widget: "page",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: DefaultStyles,
		loading: false,
	},
	listeners: {
		onPageLoad: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
	},
	render: PageBlock,
};
