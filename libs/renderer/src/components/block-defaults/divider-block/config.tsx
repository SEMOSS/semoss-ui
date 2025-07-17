import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { DividerBlockDef, DividerBlock } from "./DividerBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<DividerBlockDef> = {
    widget: "divider",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        variant: "fullWidth",
        orientation: "horizontal",
        textAlign: "center",
        flexItem: false,
        light: false,
        text: "",
        showText: false,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: DividerBlock,
};
