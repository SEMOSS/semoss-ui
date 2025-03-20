import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
} from "../block-defaults.shared";

import { IteratorBlockDef, IteratorBlock } from "./IteratorBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { InputSettings } from "../../block-settings";

// export the config for the block
export const config: BlockConfig<IteratorBlockDef> = {
    widget: "iterator",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
            flexWrap: "wrap",
        },
        iterationCount: 0,
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: IteratorBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Iterator Input",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Iterator"
                            path="iterationCount"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
