import { CSSProperties } from "react";
import { useBlocks } from "../../../hooks";
import { BlockConfig } from "../../../store";
import {
    QuerySelectionSettings,
    InputSettings,
    SelectInputSettings,
} from "../../block-settings";

import {
    buildDimensionsSection,
    buildListener,
} from "../block-defaults.shared";

import { ButtonBlockDef, ButtonBlock } from "./ButtonBlock";
import { SmartButton } from "@mui/icons-material";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {};

export function getButtonShowFieldOptions(id: string) {
    let { state } = useBlocks();
    console.log(state, state.getBlock(id), "state");
    const stateVariableList = Object.keys(state.variables).reduce(
        (acc, queryKey) => {
            if (
                state.variables[queryKey].type === "query" ||
                state.variables[queryKey].type === "cell"
            ) {
                return [
                    ...acc,
                    {
                        value: `{{${queryKey}}}`,
                        display: queryKey,
                    },
                ];
            } else {
                return [...acc];
            }
        },
        [],
    );
    console.log(stateVariableList, "stateVariableList");
    return stateVariableList;
}

// export the config for the block
export const config: BlockConfig<ButtonBlockDef> = {
    widget: "button",
    type: BLOCK_TYPE_ACTION,
    data: {
        style: DefaultStyles,
        label: "Submit",
        loading: false,
        disabled: false,
        variant: "contained",
        color: "primary",
        show: true,
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: ButtonBlock,
    icon: SmartButton,
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
                    description: "Show",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Show"
                            path="show"
                            options={[
                                {
                                    value: "true",
                                    display: "True",
                                },
                                {
                                    value: "false",
                                    display: "False",
                                },
                                ...getButtonShowFieldOptions(id),
                            ]}
                            resizeOnSet
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
            name: "Style",
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
                                    value: "contained",
                                    display: "contained",
                                },
                                {
                                    value: "outlined",
                                    display: "outlined",
                                },
                                {
                                    value: "text",
                                    display: "text",
                                },
                            ]}
                            resizeOnSet
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
            ],
        },
        buildDimensionsSection(),
    ],
};
