import { CSSProperties } from "react";
import { LabelRounded } from "@mui/icons-material";

import { Avatar } from "@semoss/ui";

import { BlockConfig } from "../../../store";
import {
    ColorSettings,
    InputSettings,
    SelectInputSettings,
} from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { ChipSettings } from "../../block-settings/custom/ChipSettings";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { ChipBlockDef, ChipBlock } from "./ChipBlock";

export const DefaultStyles: CSSProperties = {};

export const config: BlockConfig<ChipBlockDef> = {
    widget: "chip",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            color: "grey",
            ...DefaultStyles,
        },
        size: "small",
        avatar: <Avatar>A</Avatar>,
        type: "Chip",
        variant: "filled",
        label: "",
        src: "",
        title: "",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: ChipBlock,
    icon: LabelRounded,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Chip Type",
                    render: ({ id }) => (
                        <ChipSettings
                            id={id}
                            label="Type"
                            path="type"
                            options={[
                                {
                                    value: "Chip",
                                    display: "Chip",
                                },
                                {
                                    value: "Icon",
                                    display: "Icon Chip",
                                },
                                {
                                    value: "Avatar",
                                    display: "Avatar Chip",
                                },
                                {
                                    value: "Link",
                                    display: "Link Chip",
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: "clickable",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label={"Clickable"}
                            path={"clickable"}
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
        {
            name: "General",
            children: [
                {
                    description: "Variant",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Variant"
                            path="variant"
                            options={[
                                {
                                    value: "null",
                                    display: "filled",
                                },
                                {
                                    value: "outlined",
                                    display: "outlined",
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        {
            name: "Color",
            children: [
                {
                    description: "Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Color"
                            path="style.color"
                        />
                    ),
                },
            ]
        },
        {
            name: "Dimensions",
            children: [
                {
                    description: "Size",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Size"
                            path="size"
                            options={[
                                {
                                    value: "small",
                                    display: "Small",
                                },
                                {
                                    value: "medium",
                                    display: "Medium",
                                },
                            ]}
                        />
                    ),
                },
            ]
        }
    ],
};
