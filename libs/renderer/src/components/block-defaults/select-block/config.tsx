import { BlockConfig } from "../../../store";
import { SelectBlockDef, SelectBlock } from "./SelectBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";

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
};
