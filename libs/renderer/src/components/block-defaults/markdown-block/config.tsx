import { BlockConfig } from "../../../store";
import { MarkdownBlockDef, MarkdownBlock } from "./MarkdownBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
    widget: "markdown",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            padding: "4px",
        },
        markdown: "**Hello world**",
        isStreaming: false,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: MarkdownBlock,
};
