import { BlockConfig } from "../../../store";
import { InputSettings } from "../../block-settings";

import {
    buildShowField,
    buildTextAlignSection,
    buildTypographySection,
    buildListener,
} from "../block-defaults.shared";

import { LinkBlockDef, LinkBlock } from "./LinkBlock";
import { Link } from "@mui/icons-material";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: "link",
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            padding: "4px",
            whiteSpace: "pre-line",
            textOverflow: "ellipsis",
        },
        href: "",
        text: "Insert text",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: LinkBlock,
    icon: Link,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Text",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Text" path="text" />
                    ),
                },
                {
                    description: "Destination",
                    render: ({ id }) => (
                        <InputSettings
                        id={id}
                        label="Destination"
                        path="href"
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
