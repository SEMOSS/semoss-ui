import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ContainerBlock, type ContainerBlockDef } from "./ContainerBlock";

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
	widget: "container",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		type: "custom",
		dimension: null,
		show: "true",
		loading: false,
		loadType: "Skeleton",
		style: {
			display: "flex",
			flexDirection: "column",
			padding: "4px",
			gap: "8px",
			flexWrap: "wrap",
		},
		boxShadowParts: {
			offsetX: "",
			offsetY: "",
			blurRadius: "",
			spreadRadius: "",
			color: "",
		},
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		children: [],
	},
	render: ContainerBlock,
};
