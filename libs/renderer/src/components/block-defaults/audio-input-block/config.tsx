import { CSSProperties } from "react";

import { AudioInputBlockDef, AudioInputBlock } from "./AudioInputBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { BlockConfig } from "../../../store";

// export the config for the block
export const config: BlockConfig<AudioInputBlockDef> = {
    widget: "audio-input",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
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
};
