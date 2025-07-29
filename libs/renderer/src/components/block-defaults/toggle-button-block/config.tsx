import { CSSProperties } from "react";

import { BlockConfig } from "../../../store";
import { ToggleButtonBlockDef, ToggleButtonBlock } from "./ToggleButtonBlock";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<ToggleButtonBlockDef> = {
    widget: "toggle-button",
    type: BLOCK_TYPE_ACTION,
    data: {
        disabled: false,
        color: "primary",
        size: "small",
        options: [
            {
                display: "on",
                value: "on",
            },
            {
                display: "off",
                value: "off",
            },
        ],
        value: null,
        mandatory: true,
        multiple: false,
        show: "true",
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
    render: ToggleButtonBlock,
};
