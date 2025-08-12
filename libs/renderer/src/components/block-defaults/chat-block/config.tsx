import { BlockConfig } from "../../../store";

import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ChatBlockDef, ChatBlock } from "./ChatBlock";

// export the config for the block
export const config: BlockConfig<ChatBlockDef> = {
    widget: "chat",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        loading: false,
        ask: "",
        history: [],
    },
    listeners: {
        onLoad: {
            type: "async",
            order: [],
        },
        onAsk: {
            type: "async",
            order: [],
        },
    },
    slots: {
        header: [],
        content: [],
    },
    render: ChatBlock,
};
