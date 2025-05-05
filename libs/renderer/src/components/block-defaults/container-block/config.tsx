import { CSSProperties } from "react";
import { HighlightAlt } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ContainerBlockDef, ContainerBlock } from "./ContainerBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ContainerLayoutSettings } from "../../block-settings"
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildPositionSection,
    buildListener,
} from "../block-defaults.shared";

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
    },
    listeners: {
        preProcess: [],
    },
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
    ],
    styleMenu: [
        {
            name: "Layout",
            children: [
                {
                    description: "Layout",
                    render: ({ id }) => <ContainerLayoutSettings id={id} />,
                },
            ]
        },
        // buildLayoutSection(),
        buildPositionSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
