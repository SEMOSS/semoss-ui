import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { ImageBlock, type ImageBlockDef } from "./ImageBlock";

export const config: BlockConfig<ImageBlockDef> = {
	widget: "image",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			height: "200px",
			backgroundSize: "contain",
			backgroundRepeat: "no-repeat",
			backgroundPosition: "center center",
		},
		src: "",
		title: "",
		show: "true",
		unavailable: "",
		placeholderText: "",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: ImageBlock,
};
