import { HighlightAlt } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ContainerBlockDef, ContainerBlock } from "./ContainerBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ContainerLayoutSettings } from "../../block-settings";
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildListener,
    buildShowField,
} from "../block-defaults.shared";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import { SizeSettings } from "../../block-settings/shared/SizeSettings";

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: "container",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        type: "custom",
        dimension: null,
        show: "true",
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
            flexWrap: "wrap",
        },
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "Conditional",
            children: [...buildShowField()],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
        },
    ],
    styleMenu: [
        {
            name: "Layout",
            children: [
                {
                    description: "Layout",
                    render: ({ id }) => <ContainerLayoutSettings id={id} />,
                },
            ],
        },
        {
            name: "Position",
            children: [
                {
                    description: "Position",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.position"
                            label="Position"
                            options={[
                                { value: "static", display: "Static" },
                                { value: "relative", display: "Relative" },
                                { value: "absolute", display: "Absolute" },
                                { value: "fixed", display: "Fixed" },
                                { value: "sticky", display: "Sticky" },
                            ]}
                        />
                    ),
                },
                {
                    description: "Top",
                    render: ({ id }) => (
                        <SizeSettings id={id} label="Top" path="style.top" />
                    ),
                },
                {
                    description: "Z-Index",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Z-Index"
                            path="style.zIndex"
                        />
                    ),
                },
                {
                    description: "Overflow",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.overflow"
                            label="Overflow"
                            options={[
                                { value: "visible", display: "Visible" },
                                { value: "hidden", display: "Hidden" },
                                { value: "scroll", display: "Scroll" },
                                {
                                    value: "auto",
                                    display: "Auto",
                                    isDefault: true,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
