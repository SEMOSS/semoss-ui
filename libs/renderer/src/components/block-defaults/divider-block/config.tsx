import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { InputSettings, SelectInputSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildDimensionsSection } from "../block-defaults.shared";

import { DividerBlockDef, DividerBlock } from "./DividerBlock";
import { HorizontalRule } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<DividerBlockDef> = {
    widget: "divider",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        variant: "fullWidth",
        orientation: "horizontal",
        textAlign: "center",
        flexItem: false,
        light: false,
        text: "",
        showText: false,
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: DividerBlock,
    icon: HorizontalRule,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Variant",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Variant"
                            path="variant"
                            options={[
                                { value: "fullWidth", display: "Full Width" },
                                { value: "inset", display: "Inset" },
                                { value: "middle", display: "Middle" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Orientation",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Orientation"
                            path="orientation"
                            options={[
                                { value: "horizontal", display: "Horizontal" },
                                { value: "vertical", display: "Vertical" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Text Alignment",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Text Alignment"
                            path="textAlign"
                            options={[
                                { value: "center", display: "Center" },
                                { value: "left", display: "Left" },
                                { value: "right", display: "Right" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Show Text",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Show Text"
                            path="showText"
                            description="Add text to the divider"
                        />
                    ),
                },
                {
                    description: "Divider Text",
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Divider Text"
                            path="text"
                        />
                    ),
                },
                {
                    description: "Light Variant",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Light Variant"
                            path="light"
                            description="Use a lighter color for the divider"
                        />
                    ),
                },
                {
                    description: "Flex Item",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Flex Item"
                            path="flexItem"
                            description="Display as a flex item"
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
    styleMenu: [],
};
