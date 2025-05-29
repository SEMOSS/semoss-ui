import { ArrowDownward, ArrowForward, Schema } from "@mui/icons-material";

import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { BlockConfig } from "../../../store";
import { SidebarBlock, SidebarBlockDef } from "./SidebarBlock";
import {
    ButtonGroupSettings,
    SizeSettings,
    QueryInputSettings,
} from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    buildColorSection,
    buildBorderSection,
    buildListener,
    buildShowField,
} from "../block-defaults.shared";

export const config: BlockConfig<SidebarBlockDef> = {
    widget: "sidebar",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        designMode: true, // Default to design mode when first dropped
        open: "", // Default to closed
        anchor: "left",
        style: {
            width: "240px",
            height: "100%",
        },
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
        postProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        content: [],
    },
    render: SidebarBlock,
    icon: Schema,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Design Mode",
                    render: ({ id }) => (
                        <SwitchSettings
                        id={id}
                            label="Design Mode"
                            path="designMode"
                            description="Enable this in order to edit sidebar content without interference from app interactions."
                        />
                    ),
                },
                
            ],
        },
        {
            name: "Conditional",
            children: [
                ...buildShowField(),
                {
                    description: "Open State",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Open State"
                            path="open"
                        />
                    ),
                },
            ],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
        {
            name: "Post Process",
            children: [...buildListener("postProcess")],
        },
    ],
    styleMenu: [
        {
            name: "Layout",
            children: [
                {
                    description: "Direction",
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="anchor"
                            label="Direction"
                            options={[
                                {
                                    value: "top",
                                    icon: ArrowDownward,
                                    title: "Top",
                                    isDefault: false,
                                },
                                {
                                    value: "left",
                                    icon: ArrowForward,
                                    title: "Left",
                                    isDefault: true,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        {
            name: "Dimensions",
            children: [
                {
                    description: "Width",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Width"
                            path="style.width"
                        />
                    ),
                },
                {
                    description: "Height",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Height"
                            path="style.height"
                        />
                    ),
                },
            ],
        },
        buildColorSection(),
        {
            name: "Spacing",
            children: [
                {
                    description: "Padding",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Padding"
                            path="style.padding"
                        />
                    ),
                },
            ],
        },
        buildBorderSection(),
    ],
};
