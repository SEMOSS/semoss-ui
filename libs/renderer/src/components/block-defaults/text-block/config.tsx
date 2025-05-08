import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import {
    buildTypographySection,
    buildTextAlignSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";
import { TextBlockDef, TextBlock } from "./TextBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { QueryInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: "text",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Hello world",
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
    render: TextBlock,
    icon: TextFields,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
                {
                    description: "Text",
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Text" path="text" />
                    ),
                },
                {
                    description: "Enable Typewriting Effect",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Typewriting Effect"
                            path="isStreaming"
                            description="This setting will enable the typewriting effect on the text"
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
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
