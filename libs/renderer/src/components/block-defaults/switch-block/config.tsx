import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { SwitchBlockDef, SwitchBlock } from "./SwitchBlock";
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
};
