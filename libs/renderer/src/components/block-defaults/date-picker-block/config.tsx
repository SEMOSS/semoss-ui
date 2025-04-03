import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildDimensionsSection } from "../block-defaults.shared";

import { DateBlockDef, DateBlock } from "./DateBlock";
import { CalendarMonth } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<DateBlockDef> = {
    widget: "date",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: "Select Date",
        value: "",
        variant: "picker",
        format: "MM/DD/YYYY",
        disabled: false,
        required: false,
        fullWidth: true,
        placeholder: "",
        clearable: true,
        size: "small",
        disableFuture: false,
        disablePast: false,
        minDate: "",
        maxDate: "",
        views: ["year", "month", "day"],
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: DateBlock,
    icon: CalendarMonth,
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
                    description: "Default Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Default Value"
                            path="value"
                            description="ISO date string or empty for no default"
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
                                { value: "picker", display: "Date Picker" },
                                { value: "field", display: "Date Field" },
                                { value: "calendar", display: "Date Calendar" },
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
                            description="e.g., 'MM/DD/YYYY' or 'YYYY-MM-DD'"
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
                            description="Disable date input"
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
                            description="Allow clearing the selected date"
                        />
                    ),
                },
                {
                    description: "Disable Future Dates",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disable Future Dates"
                            path="disableFuture"
                            description="Prevent selection of future dates"
                        />
                    ),
                },
                {
                    description: "Disable Past Dates",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disable Past Dates"
                            path="disablePast"
                            description="Prevent selection of past dates"
                        />
                    ),
                },
                {
                    description: "Minimum Date",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Minimum Date"
                            path="minDate"
                            description="ISO date string for earliest selectable date"
                        />
                    ),
                },
                {
                    description: "Maximum Date",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Maximum Date"
                            path="maxDate"
                            description="ISO date string for latest selectable date"
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
                            description="Comma-separated list of: year, month, day"
                            valueAsObject={true}
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
    styleMenu: [],
};
