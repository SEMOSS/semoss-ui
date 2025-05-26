import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { CheckboxBlockDef, CheckboxBlock } from "./CheckboxBlock";
import { CheckBox } from "@mui/icons-material";
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
    icon: CheckBox,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Checked",
                    render: ({ id }) => (
                        <SwitchSettings id={id} label="Checked" path="value" />
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
