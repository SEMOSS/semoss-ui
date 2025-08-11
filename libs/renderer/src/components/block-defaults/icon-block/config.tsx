import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { IconBlock, type IconBlockDef } from "./IconBlock";

export const config: BlockConfig<IconBlockDef> = {
	widget: "icon",
	type: BLOCK_TYPE_DISPLAY,
	data: {
		style: {
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			height: "200px",
			color: "black",
		},
		icon: "Home",
		src: "",
		title: "",
		show: "true",
		badgeContent: 0,
		color: "default",
		showBadge: false,
	},
	listeners: {},
	slots: {},
	render: IconBlock,
};
