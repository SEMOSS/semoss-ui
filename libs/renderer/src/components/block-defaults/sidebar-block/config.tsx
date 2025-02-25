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
} from "../block-defaults.shared";

export const config: BlockConfig<SidebarBlockDef> = {
    widget: "sidebar",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        anchor: "left",
        sidebarWidth: 240,
        sidebarHeight: "100%",
        designMode: true, // Default to design mode when first dropped
        open: "", // Default to closed
    },
    listeners: {},
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
                            description="Enable to edit modal content"
                        />
                    ),
                },
                {
                    description: "Open",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Open Modal"
                            path="open"
                        />
                    ),
                },
                {
                    description: "Sidebar Width",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Sidebar Width"
                            path="sidebarWidth"
                        />
                    ),
                },
                {
                    description: "Sidebar Height",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Sidebar Height"
                            path="sidebarHeight"
                        />
                    ),
                },
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
    ],
    styleMenu: [
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
