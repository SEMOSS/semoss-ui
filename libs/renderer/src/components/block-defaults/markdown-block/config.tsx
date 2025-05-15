import { BlockConfig } from "../../../store";
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildTextAlignSection,
    buildBorderSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";

import { MarkdownBlockDef, MarkdownBlock } from "./MarkdownBlock";
import { FormatListBulleted } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { QueryInputSettings } from "../../block-settings";

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
    widget: "markdown",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            padding: "4px",
        },
        markdown: "**Hello world**",
        isStreaming: false,
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: MarkdownBlock,
    icon: FormatListBulleted,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Markdown",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Markdown"
                            path="markdown"
                        />
                    ),
                },
                {
                    description: "Enable Typewriting Effect",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Typewriting Effect"
                            path="isStreaming"
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
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
