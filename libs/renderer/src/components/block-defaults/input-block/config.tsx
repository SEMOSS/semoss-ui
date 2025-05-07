import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { InputSettings, QuerySelectionSettings } from "../../block-settings";

import { InputBlockDef, InputBlock } from "./InputBlock";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { FormatShapes } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import { InputModalSettings } from "../../block-settings/shared/InputModalSettings";

export const DefaultStyles: CSSProperties = {
    width: "100%",
    padding: "4px",
};

// export the config for the block
export const config: BlockConfig<InputBlockDef> = {
    widget: "input",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        value: "",
        label: "Example Input",
        hint: "",
        type: "text",
        rows: 1,
        multiline: false,
        disabled: false,
        required: false,
        loading: false,
        show: "true",
    },
    listeners: {
        preProcess: [],
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: InputBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
                {
                    description: "Value",
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Value"
                            path="value"
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
                    description: "Hint",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: "Input Type",
                    render: ({ id }) => {
                        return (
                            <SelectInputSettings
                                id={id}
                                path="type"
                                label="Type"
                                options={[
                                    {
                                        value: "text",
                                        display: "Text",
                                    },
                                    {
                                        value: "number",
                                        display: "Number",
                                    },
                                    {
                                        value: "date",
                                        display: "Date",
                                    },
                                ]}
                            />
                        );
                    },
                },
                {
                    description: "Rows",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Rows"
                            path="rows"
                            type="number"
                            description="This will determine how many rows are displayed on text input"
                        />
                    ),
                },
                {
                    description: "Loading",
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
                {
                    description: "Disabled",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="disabled"
                            path="disabled"
                        />
                    ),
                },
                {
                    description: "Required",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Required"
                            path="required"
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
    ],
    styleMenu: [],
};
