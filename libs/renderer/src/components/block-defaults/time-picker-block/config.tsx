import { CSSProperties } from "react";
import { AccessTime } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { TimePickerBlockDef, TimePickerBlock } from "./TimePickerBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    buildDimensionsSection,
    buildListener,
} from "../block-defaults.shared";

export const DefaultStyles: CSSProperties = {};

// Helper function to generate multi-select options for views
const getViewsOptions = () => {
    const views = [
        { label: "Hours", value: "hours" },
        { label: "Minutes", value: "minutes" },
        { label: "Seconds", value: "seconds" },
    ];

    return views;
};

// export the config for the block
export const config: BlockConfig<TimePickerBlockDef> = {
    widget: "timepicker",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: "Select Time",
        value: "",
        variant: "picker",
        ampm: true,
        format: "hh:mm a",
        disabled: false,
        required: false,
        fullWidth: true,
        placeholder: "",
        clearable: true,
        size: "small",
        views: ["hours", "minutes"],
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
        onChange: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: TimePickerBlock,
    icon: AccessTime,
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
                    description: "Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Value"
                            path="value"
                            description="ISO time string or empty for no default"
                        />
                    ),
                },
                {
                    description: "Variant",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Variant"
                            path="variant"
                            options={[
                                { value: "picker", display: "Time Picker" },
                                { value: "field", display: "Time Field" },
                                { value: "digital", display: "Digital Clock" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Format",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Format"
                            path="format"
                            description="e.g., 'hh:mm a' for 12-hour or 'HH:mm' for 24-hour"
                        />
                    ),
                },
                {
                    description: "Time Format",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="12-hour format (AM/PM)"
                            path="ampm"
                            description="Toggle between 12-hour and 24-hour time format"
                        />
                    ),
                },
                {
                    description: "Placeholder",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Placeholder"
                            path="placeholder"
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
                            description="Disable time input"
                        />
                    ),
                },
                {
                    description: "Full Width",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Full Width"
                            path="fullWidth"
                            description="Expand to fill container width"
                        />
                    ),
                },
                {
                    description: "Clearable",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Clearable"
                            path="clearable"
                            description="Allow clearing the selected time"
                        />
                    ),
                },
                {
                    description: "Views",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Views (comma-separated)"
                            path="views"
                            description="Comma-separated list of: hours, minutes, seconds"
                            valueAsObject={true}
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
