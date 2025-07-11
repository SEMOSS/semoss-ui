import { BlockConfig } from "../../../store";
import { PopoverBlock, PopoverBlockDef } from "./PopoverBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

export const config: BlockConfig<PopoverBlockDef> = {
    widget: "popover",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        designMode: true,
        targetId: null,

        open: "",
        openTrigger: "click",
    },
    listeners: {
        onOpen: {
            type: "sync",
            order: [],
        },
        onClose: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        header: [],
        content: [],
    },
    render: PopoverBlock,
};
