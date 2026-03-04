import { CSSProperties } from "react";
import { Avatar } from "@semoss/ui";
import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { ChipBlock, type ChipBlockDef } from "./ChipBlock";

export const config: BlockConfig<ChipBlockDef> = {
	widget: "chip",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {
			color: "grey",
		},
		size: "small",
		avatar: <Avatar>A</Avatar>,
		type: "Chip",
		variant: "filled",
		label: "",
		src: "",
		title: "",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: ChipBlock,
};
