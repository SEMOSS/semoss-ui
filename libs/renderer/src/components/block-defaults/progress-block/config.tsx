import { BlockConfig } from "../../../store";
import { ProgressBlockDef, ProgressBlock } from "./ProgressBlock";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<ProgressBlockDef> = {
    widget: "progress",
    type: BLOCK_TYPE_CHART,
    data: {
        type: "linear",
        value: 50,
        includeLabel: true,
        size: "300px",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: ProgressBlock,
};
