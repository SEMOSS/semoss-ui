import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
} from "../block-defaults.shared";

import { IterBlockDef, IterBlock } from "./IterBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { InputSettings, QuerySelectionSettings, QueryInputSettings } from "../../block-settings";

// export the config for the block
export const config: BlockConfig<IterBlockDef> = {
    widget: "iter",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        iterationCount: 0,
        value: [],
        type: "iteration",
        sourceBlockList: [],
        iteratorDropDownChange: false,
    },
    listeners: {
    },
    slots: {
        children: [],
    },
    render: IterBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "General",
            children: [
                // {
                //     description: "Iteration Value",
                //     render: ({ id }) => (
                //         <QuerySelectionSettings
                //             id={id}
                //             label="Iteration Array"
                //             path="value"
                //             queryPath="isLoading"
                //         />
                //     ),
                // },
                {
                    description: "Iteration Value",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Iteration Array"
                            path="value"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        // buildLayoutSection(),
        // buildSpacingSection(),
        // buildDimensionsSection(),
        // buildColorSection(),
        // buildBorderSection(),
    ],
};
