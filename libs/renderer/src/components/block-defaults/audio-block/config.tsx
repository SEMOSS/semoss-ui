import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";

import { AudioBlockDef, AudioBlock } from "./AudioBlock";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<AudioBlockDef> = {
    widget: "audio-player",
    type: BLOCK_TYPE_ACTION,
    data: {
        label: "Audio Player",
        autoplay: false,
        controls: true,
        loop: false,
        source: "",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: AudioBlock,
};
