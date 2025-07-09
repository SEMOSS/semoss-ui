import { BlockConfig } from "../../../store";
import { LogsBlockDef, LogsBlock } from "./LogsBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

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
