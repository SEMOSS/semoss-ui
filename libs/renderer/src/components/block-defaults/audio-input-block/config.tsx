import { CSSProperties } from "react";
import { KeyboardVoice } from "@mui/icons-material";

import { AudioInputBlockDef, AudioInputBlock } from "./AudioInputBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { InputAudioSettings } from "../../block-settings/shared/InputAudioSettings";
import { BlockConfig } from "../../../store";
import {
    SelectInputSettings,
    QuerySelectionSettings,
} from "../../block-settings";
import {
    buildDimensionsSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<AudioInputBlockDef> = {
    widget: "audio-input",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: "Submit",
        loading: false,
        disabled: false,
        variant: "contained",
        color: "primary",
        value: "",
        mode: "transcribe",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
        onComplete: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: AudioInputBlock,
    icon: KeyboardVoice,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
                {
                    description: "Mode",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Mode"
                            path="mode"
                            options={[
                                {
                                    value: "transcribe",
                                    display: "Speech to Text",
                                },
                                { value: "record", display: "Audio Recording" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Value",
                    render: ({ id }) => (
                        <InputAudioSettings
                            id={id}
                            label="Value"
                            path="value"
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
            ],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
        {
            name: "on Complete",
            children: [...buildListener("onComplete")],
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
