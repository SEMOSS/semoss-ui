import { BlockConfig } from "../../../store";
import { IframeBlockDef, IframeBlock } from "./IframeBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<IframeBlockDef> = {
    widget: "iframe",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        src: "",
        title: "",
        enableFrameInteractions: true,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: IframeBlock,
};
