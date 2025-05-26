import { ViewList } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { SelectBlockDef, SelectBlock } from "./SelectBlock";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SelectInputValueSettings } from "../../block-settings/custom/SelectInputValueSettings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    InputSettings,
    QuerySelectionSettings,
    SelectOptionsSettings,
} from "../../block-settings";

// export the config for the block
export const config: BlockConfig<SelectBlockDef> = {
    widget: "select",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: "4px",
        },
        value: "",
        label: "Example Select Input",
        hint: "",
        options: [],
        required: false,
        disabled: false,
        loading: false,
        optionLabel: "",
        optionSublabel: "",
        optionValue: "",
        multiple: false,
        show: true,
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
    slots: {
        content: [],
    },
    render: SelectBlock,
    icon: ViewList,
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
                    description: "Hint",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: "Multi Select",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Multi Select"
                            path="multiple"
                            description="This setting will enable the multi-select feature on the select input"
                        />
                    ),
                },
                {
                    description: "Option Settings",
                    render: ({ id }) => {
                        return (
                            <SelectOptionsSettings
                                id={id}
                                optionData={[
                                    {
                                        label: "Label",
                                        path: "optionLabel",
                                    },
                                    {
                                        label: "Sublabel",
                                        path: "optionSublabel",
                                    },
                                ]}
                                label="Option Label"
                                path="optionLabel"
                            />
                        );
                    },
                },
                {
                    description: "Value",
                    render: ({ id }) => (
                        <SelectInputValueSettings id={id} path="value" />
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
        {
            name: "On Change",
            children: [...buildListener("onChange")],
        },
    ],
    styleMenu: [],
};
