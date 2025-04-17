import { BlockConfig } from "../../../store";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildPositionSection,
} from "../block-defaults.shared";

import { FlipCardBlockDef, FlipCardBlock } from "./FlipCardBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { SwitchSettings, ColorSettings } from "../../block-settings/shared";

// export the config for the block
export const config: BlockConfig<FlipCardBlockDef> = {
    widget: "flip-card",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
        },
        frontBgColor: "#ffffff",
        backBgColor: "#ffffff",
        isFlipped: false,
        show: "true",
    },
    listeners: {},
    slots: {
        front: [],
        back: [],
    },
    render: FlipCardBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Flip back",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Flip back"
                            path="isFlipped"
                            description="Enable to flip back the card"
                        />
                    ),
                },
                {
                    description: "Front Background Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Front Background Color"
                            path="frontBgColor"
                        />
                    ),
                },
                {
                    description: "Back Background Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Back Background Color"
                            path="backBgColor"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildPositionSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildBorderSection(),
    ],
};
