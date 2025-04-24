import { CSSProperties } from "react";
import { LabelRounded } from "@mui/icons-material";

import { Avatar } from "@semoss/ui";

import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
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
        style: DefaultStyles,
        color: "default",
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
        //onClick: [],
    },
    slots: {},
    render: ChipBlock,
    icon: LabelRounded,

    contentMenu: [
        {
            name: "General",
            children: [...buildShowField()],
        },
        {
            name: "Select Chip",
            children: [
                {
                    description: " Chip Type",
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
            name: "on Click",
            children: [...buildListener("onClick")],
        },
    ],
    styleMenu: [
        {
            name: "",
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
                {
                    description: "Color",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Color"
                            path="color"
                            options={[
                                {
                                    value: "default",
                                    display: "default",
                                },
                                {
                                    value: "primary",
                                    display: "primary",
                                },
                                {
                                    value: "secondary",
                                    display: "secondary",
                                },
                                {
                                    value: "success",
                                    display: "success",
                                },
                                {
                                    value: "warning",
                                    display: "warning",
                                },
                                {
                                    value: "error",
                                    display: "error",
                                },
                            ]}
                        />
                    ),
                },
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
                                    display: "small",
                                },
                                {
                                    value: "medium",
                                    display: "medium",
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
    ],
};
