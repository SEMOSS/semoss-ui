import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { TextBlockDef, TextBlock } from "./TextBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: "text",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Hello world",
        isStreaming: false,
        show: "true",
        loading: false,
        loadSkeleton: "",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: TextBlock,
};
