import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { FormBlock, type FormBlockDef } from "./FormBlock";

// export the config for the block
export const config: BlockConfig<FormBlockDef> = {
	widget: "form",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		type: "",
		dimension: null,
		show: "true",
		loading: false,
		database: "",
		table: "",
		column: [""],
		style: {
			display: "flex",
			flexDirection: "column",
			padding: "4px",
			gap: "8px",
			flexWrap: "wrap",
		},
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
		onSubmit: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		children: [],
	},
	render: FormBlock,
};
