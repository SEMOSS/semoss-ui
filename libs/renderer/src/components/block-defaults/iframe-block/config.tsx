import { AspectRatio } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { IframeBlockDef, IframeBlock } from "./IframeBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { InputModalSettings } from "../../block-settings/shared/InputModalSettings";
import { BorderSettings, InputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";

// export the config for the block
export const config: BlockConfig<IframeBlockDef> = {
    widget: "iframe",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        src: "",
        title: "",
        enableFrameInteractions: true,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: IframeBlock,
    icon: AspectRatio,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Source",
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Source"
                            placeholder="https://www.example.com"
                            path="src"
                        />
                    ),
                },
                {
                    description: "Title",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Title" path="title" />
                    ),
                },
                {
                    description: "Frame Interaction",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Frame Interaction"
                            path="enableFrameInteractions"
                        />
                    ),
                },
            ],
        },
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
        buildDimensionsSection(),
        buildSpacingSection(),
        {
            name: "Color",
            children: [
                {
                    description: "Border",
                    render: ({ id }) => (
                        <BorderSettings id={id} path="style.border" />
                    ),
                },
            ],
        },
    ],
};
