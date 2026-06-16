import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { LogsBlock, type LogsBlockDef } from "./logs-block";

export const config: BlockConfig<LogsBlockDef> = {
	widget: "logs",
	type: BLOCK_TYPE_LAYOUT,
	data: {
		style: {},
		queryId: "",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: LogsBlock,
};
