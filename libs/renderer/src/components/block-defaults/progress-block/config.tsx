import { BlurLinear } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ProgressBlockDef, ProgressBlock } from "./ProgressBlock";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildShowField, buildListener } from "../block-defaults.shared";
import {
    InputSettings,
    SelectInputSettings,
    SizeSettings,
} from "../../block-settings";

// export the config for the block
export const config: BlockConfig<ProgressBlockDef> = {
    widget: "progress",
    type: BLOCK_TYPE_CHART,
    data: {
        type: "linear",
        value: 50,
        includeLabel: true,
        size: "300px",
        show: "true",
    },
    listeners: {
        preProcess: [],
    },
    slots: {},
    render: ProgressBlock,
    icon: BlurLinear,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
                {
                    description: "Type",
                    render: ({ id }) => {
                        return (
                            <SelectInputSettings
                                id={id}
                                path="type"
                                label="Type"
                                resizeOnSet
                                options={[
                                    {
                                        value: "linear",
                                        display: "linear",
                                    },
                                    {
                                        value: "circular",
                                        display: "circular",
                                    },
                                ]}
                            />
                        );
                    },
                },
                {
                    description: "Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Value"
                            path="value"
                            type="value"
                        />
                    ),
                },
                {
                    description: "Include Label",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Include Label"
                            path="includeLabel"
                        />
                    ),
                },
            ],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
    ],
    styleMenu: [
        {
            name: "Dimensions",
            children: [
                {
                    description: "Size",
                    render: ({ id }) => (
                        <SizeSettings id={id} label="Size" path="size" />
                    ),
                },
            ],
        },
    ],
};
