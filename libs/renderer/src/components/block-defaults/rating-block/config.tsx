import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildDimensionsSection } from "../block-defaults.shared";

import { RatingBlockDef, RatingBlock } from "./RatingBlock";
import { Star } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<RatingBlockDef> = {
    widget: "rating",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: "Rate this item",
        value: 0,
        precision: 1,
        max: 5,
        size: "medium",
        readOnly: false,
        disabled: false,
        highlightSelectedOnly: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: RatingBlock,
    icon: Star,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: "Default Value",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Default Value"
                            path="value"
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
                    description: "Precision",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Precision"
                            path="precision"
                            type="number"
                        />
                    ),
                },
                {
                    description: "Size",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Size"
                            path="size"
                            options={[
                                { value: "small", display: "Small" },
                                { value: "medium", display: "Medium" },
                                { value: "large", display: "Large" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Read Only",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Read Only"
                            path="readOnly"
                            description="When enabled, users cannot change the rating"
                        />
                    ),
                },
                {
                    description: "Disabled",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disabled"
                            path="disabled"
                            description="When enabled, grays out the rating component"
                        />
                    ),
                },
                {
                    description: "Highlight Selected Only",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Highlight Selected Only"
                            path="highlightSelectedOnly"
                            description="When enabled, only highlights the selected star"
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
    styleMenu: [],
};
