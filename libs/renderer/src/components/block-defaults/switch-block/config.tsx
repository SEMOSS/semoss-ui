import { CSSProperties } from "react";
import { ToggleOn } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { SwitchBlockDef, SwitchBlock } from "./SwitchBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    buildDimensionsSection,
    buildListener,
} from "../block-defaults.shared";
import {
    InputSettings,
    QueryInputSettings,
    SelectInputSettings,
} from "../../block-settings";

export const DefaultStyles: CSSProperties = {
    width: "fit-content",
};

// export the config for the block
export const config: BlockConfig<SwitchBlockDef> = {
    widget: "switch",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: "Toggle Switch",
        value: false,
        disabled: false,
        color: "primary",
        size: "medium",
        helperText: "",
        required: false,
        labelPlacement: "end",
    },
    listeners: {
        onChange: {
            type: "sync",
            order: [],
        },
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: SwitchBlock,
    icon: ToggleOn,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: "Helper Text",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Helper Text"
                            path="helperText"
                        />
                    ),
                },
                {
                    description: "Label Placement",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Label Placement"
                            path="labelPlacement"
                            options={[
                                { value: "end", display: "Right" },
                                { value: "start", display: "Left" },
                                { value: "top", display: "Top" },
                                { value: "bottom", display: "Bottom" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Value",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Value"
                            path="value"
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
                                { value: "primary", display: "Primary" },
                                { value: "secondary", display: "Secondary" },
                                { value: "default", display: "Default" },
                                { value: "error", display: "Error" },
                                { value: "info", display: "Info" },
                                { value: "success", display: "Success" },
                                { value: "warning", display: "Warning" },
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
                                { value: "small", display: "Small" },
                                { value: "medium", display: "Medium" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Required",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Required"
                            path="required"
                            description="Mark field as required"
                        />
                    ),
                },
                {
                    description: "Disabled",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disabled"
                            path="disabled"
                            description="Disable switch interaction"
                        />
                    ),
                },
            ],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
        {
            name: "on Change",
            children: [...buildListener("onChange")],
        },
        buildDimensionsSection(),
    ],
    styleMenu: [],
};
