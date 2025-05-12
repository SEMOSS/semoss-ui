import { observer } from "mobx-react-lite";
import { BlurLinear } from "@mui/icons-material";

import { Select, MenuItem } from "@semoss/ui";

import { BlockConfig } from "../../../store";
import { useBlockSettings } from "../../../hooks";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { SliderBlockDef, SliderBlock } from "./SliderBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import {
    ColorSettings,
    InputSettings,
    OptionsSettings,
    SizeSettings,
} from "../../block-settings";

// export the config for the block
export const config: BlockConfig<SliderBlockDef> = {
    widget: "slider",
    type: BLOCK_TYPE_INPUT,
    data: {
        type: "continuous",
        style: {
            color: "primary",
        },
        marks: [],
        steps: 1,
        value: 0,
        min: 0,
        max: 100,
        size: "300px",
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
    render: SliderBlock,
    icon: BlurLinear,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Type",
                    render: observer(({ id }) => {
                        const { data, setData } = useBlockSettings(id);

                        const options = [
                            {
                                value: "continuous",
                                display: "Continuous",
                            },
                            {
                                value: "discrete",
                                display: "Discrete",
                            },
                        ];
                        const onChange = (value: string) => {
                            setData("type", value);
                        };
                        return (
                            <Select
                                label="Type"
                                fullWidth
                                size="small"
                                value={data.type}
                                onChange={(e) => {
                                    onChange(e.target.value);
                                }}
                            >
                                {Array.from(options, (option, i) => {
                                    return (
                                        <MenuItem key={i} value={option.value}>
                                            {option.display}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        );
                    }),
                },
                {
                    description: "Marks",
                    render: observer(({ id }) => {
                        const { data } = useBlockSettings(id);
                        return (
                            <>
                                {data.type === "discrete" && (
                                    <OptionsSettings
                                        id={id}
                                        path="marks"
                                        label="Marks"
                                        tooltip="Add marks to the slider"
                                    />
                                )}
                            </>
                        );
                    }),
                },
                {
                    description: "Steps",
                    render: observer(({ id }) => {
                        const { data } = useBlockSettings(id);

                        return (
                            <>
                                {data.type === "discrete" && (
                                    <InputSettings
                                        id={id}
                                        label="Steps"
                                        path="steps"
                                        type="number"
                                        description="Define the number of steps in the slider"
                                    />
                                )}
                            </>
                        );
                    }),
                },
                {
                    description: "Minimum Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Minimum Value"
                            path="min"
                            type="number"
                        />
                    ),
                },
                {
                    description: "Maximum Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Maximum Value"
                            path="max"
                            type="number"
                        />
                    ),
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
    styleMenu: [
        {
            name: "Color",
            children: [
                {
                    description: "Slider Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Slider Color"
                            path="style.color"
                        />
                    ),
                },
            ],
        },
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
