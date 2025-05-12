import { BlockConfig } from "../../../store";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildPositionSection,
    buildListener,
} from "../block-defaults.shared";

import { FlipCardBlockDef, FlipCardBlock } from "./FlipCardBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { SwitchSettings, ColorSettings } from "../../block-settings/shared";

// TODO:
// -------------------------------------------------------------
// 1. So maybe the Flip cards height should have the default height set to auto, in order to let the child els to dictate the height of the card
// 2. Maybe we want the Flip behavior to only happen on click vs hover add settings to allow that
// 3. Event listeners Flip Card, onClick onHover
// 4. Reorganize settings
// -------------------------------------------------------------

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
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
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
        buildBorderSection(),
    ],
};
