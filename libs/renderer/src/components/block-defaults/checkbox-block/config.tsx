import { BlockConfig } from "../../../store";
import { CheckboxBlockDef, CheckboxBlock } from "./CheckboxBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";

// export the config for the block
export const config: BlockConfig<CheckboxBlockDef> = {
    widget: "checkbox",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: "none",
        },
        label: "Example Checkbox",
        required: false,
        disabled: false,
        value: false,
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
    render: CheckboxBlock,
};
