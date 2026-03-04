import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ModalBlock, type ModalBlockDef } from "./ModalBlock";

export const config: BlockConfig<ModalBlockDef> = {
	widget: "modal",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: {},
		title: "Modal Title",
		fullWidth: true,
		maxWidth: "sm",
		minWidth: "sm",
		designMode: true, // Default to design mode when first dropped
		open: "", // Default to closed
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		onClose: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
		footer: [], // New slot for footer content
	},
	render: ModalBlock,
};
