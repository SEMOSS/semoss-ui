import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildDimensionsSection } from "../block-defaults.shared";

import { SwitchBlockDef, SwitchBlock } from "./SwitchBlock";
import { ToggleOn } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";

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
        onChange: [],
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
                        <SwitchSettings
                            id={id}
                            label="Value"
                            path="value"
                            description="The state of the switch"
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
        buildDimensionsSection(),
    ],
    styleMenu: [],
};
