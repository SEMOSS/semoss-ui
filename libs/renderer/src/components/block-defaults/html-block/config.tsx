import { BlockConfig } from "../../../store";
import { HTMLBlockDef, HTMLBlock } from "./HTMLBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<HTMLBlockDef> = {
    widget: "html",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        html: "",
    },
    listeners: {},
    slots: {},
    render: HTMLBlock,
};
