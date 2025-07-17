import { IterationBlockDef, IterationBlock } from "./IterationBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { BlockConfig } from "../../../store";

// export the config for the block
export const config: BlockConfig<IterationBlockDef> = {
    widget: "iteration",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        source: "",
        child: null,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        children: [],
    },
    render: IterationBlock,
};
