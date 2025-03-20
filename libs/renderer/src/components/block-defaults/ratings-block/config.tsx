import { Star } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { buildListener } from "../block-defaults.shared";
import { RatingsBlock, RatingsBlockDef } from "./RatingsBlock";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { SelectInputSettings, InputSettings } from "../../block-settings";

// export the config for the block
export const config: BlockConfig<RatingsBlockDef> = {
    widget: "ratings",
    type: BLOCK_TYPE_ACTION,
    data: {
        size: "small",
        type: "star",
        max: 5,
        value: 2,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: RatingsBlock,
    icon: Star,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Type",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Type"
                            path="type"
                            options={[
                                {
                                    value: "heart",
                                    display: "Heart",
                                },
                                {
                                    value: "star",
                                    display: "Star",
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: "Max Rating",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Max Rating"
                            path="max"
                            type="number"
                            valueAsObject={false}
                            min={1}
                            limit={10}
                            description="Set the maximum rating (1-10)"
                        />
                    ),
                },
            ],
        },
        {
            name: "on Change",
            children: [...buildListener("onChange")],
        },
    ],
    styleMenu: [
        {
            name: "Style",
            children: [
                {
                    description: "Size",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Size"
                            path="size"
                            options={[
                                {
                                    value: "small",
                                    display: "small",
                                },
                                {
                                    value: "large",
                                    display: "large",
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
    ],
};
