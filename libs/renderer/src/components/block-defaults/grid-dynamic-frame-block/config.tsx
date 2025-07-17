import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { BlockConfig } from "../../../store";
import {
    GridDynamicFrameBlockDef,
    GridDynamicFrameBlock,
} from "./GridDynamicFrameBlock";

// export the config for the block
export const config: BlockConfig<GridDynamicFrameBlockDef> = {
    widget: "grid-dynamic-frame",
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: "",
        },
        columns: [],
        style: {
            display: "flex",
            flexDirection: "row",
            padding: "",
            gap: "",
            flexWrap: "wrap",
            width: "450px",
            height: "350px",
        },
        view: {
            pagination: true,
        },
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
        },
        show: true,
    },

    listeners: {},
    slots: {},
    render: GridDynamicFrameBlock,
};
