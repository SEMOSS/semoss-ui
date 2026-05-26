import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { GridBlock, type GridBlockDef } from "./grid-block";

// export the config for the block
export const config: BlockConfig<GridBlockDef> = {
	widget: "grid",
	type: BLOCK_TYPE_DATA,
	data: {
		frame: {
			name: "",
		},
		option: {},
		columns: [],
		variation: "grid-block",
		style: {
			display: "flex",
			flexDirection: "row",
			padding: "",
			gap: "",
			flexWrap: "wrap",
			width: "450px",
			height: "350px",
		},
		view: {
			pagination: true,
		},
		contextMenu: {
			hideFilter: false,
			hideUnfilter: false,
		},
		show: true,
	},

	listeners: {},
	slots: {},
	render: GridBlock,
};
