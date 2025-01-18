import { BlockConfig } from "../../../../store";
import {
    InputSettings,
    QuerySelectionSettings,
    SelectOptionsSettings,
} from "../../../block-settings";

import { StepperBlockDef, StepperBlock } from "./StepperBlock";
import { ViewList } from "@mui/icons-material";

import { buildListener } from "../../block-defaults.shared";
import { BLOCK_TYPE_INPUT } from "../../block-defaults.constants";
import { SelectInputValueSettings } from "../../../block-settings/custom/SelectInputValueSettings";
import { SwitchSettings } from "../../../block-settings/shared/SwitchSettings";

// export the config for the block
export const config: BlockConfig<StepperBlockDef> = {
    widget: "stepper",
    type: BLOCK_TYPE_INPUT,
    data: {
        steps: [],
        activeStep: 0,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: StepperBlock,
    icon: ViewList,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Steps",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Multi Select"
                            path="multiple"
                            description="This setting will enable the multi-select feature on the select input"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
