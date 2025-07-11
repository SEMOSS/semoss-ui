import { BlockConfig } from "../../../store";
import { LinkBlockDef, LinkBlock } from "./LinkBlock";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: "link",
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            padding: "4px",
            whiteSpace: "pre-line",
            textOverflow: "ellipsis",
        },
        href: "",
        text: "Insert text",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: LinkBlock,
};
