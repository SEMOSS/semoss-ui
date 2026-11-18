import type { CSSProperties } from "react";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { UploadBlock, type UploadBlockDef } from "./UploadBlock";

const DefaultStyles: CSSProperties = {
	width: "100%",
	padding: "4px",
};

// export the config for the block
export const config: BlockConfig<UploadBlockDef> = {
	widget: "upload",
	type: BLOCK_TYPE_INPUT,
	data: {
		style: DefaultStyles,
		value: "",
		label: "Example Input",
		hint: "",
		extensions: [],
		loading: false,
		disabled: false,
		required: false,
		multiple: false,
		show: "true",
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
	render: UploadBlock,
};
