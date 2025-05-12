import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildPositionSection,
    buildListener,
    buildShowField,
} from "../block-defaults.shared";

import { ContainerBlockDef, ContainerBlock } from "./ContainerBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: "container",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
            flexWrap: "wrap",
        },
        show: "true",
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
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "Conditional",
            children: [...buildShowField()],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildPositionSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
