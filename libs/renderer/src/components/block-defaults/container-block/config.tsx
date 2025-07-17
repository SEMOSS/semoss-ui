import { HighlightAlt } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ContainerBlockDef, ContainerBlock } from "./ContainerBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: "container",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        type: "custom",
        dimension: null,
        show: "true",
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
            flexWrap: "wrap",
        },
        boxShadowParts: {
            offsetX: "",
            offsetY: "",
            blurRadius: "",
            spreadRadius: "",
            color: "",
        },
        loading: false,
        loadSkeleton: "none",
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
    render: ContainerBlock,
};
