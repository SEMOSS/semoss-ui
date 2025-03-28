import { Schema } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ColorSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { AccordionBlock, AccordionBlockDef } from "./AccordionBlock";
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildShowField,
} from "../block-defaults.shared";

export const config: BlockConfig<AccordionBlockDef> = {
    widget: "accordion",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        triggerBgColor: "",
        contentBgColor: "",
        showExpandIcon: true,
        show: "true",
    },
    listeners: {},
    slots: {
        header: [],
        content: [],
    },
    render: AccordionBlock,
    icon: Schema,
    contentMenu: [
        {
            name: "Accessories",
            children: [
                ...buildShowField(),
                {
                    description: "Show expand icon",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Show expand icon"
                            path="showExpandIcon"
                            description="Enable to show expand icon in accordion"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildSpacingSection(),
        buildDimensionsSection(),
        {
            name: "Color",
            children: [
                {
                    description: "Summary Background Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Summary Background Color"
                            path="triggerBgColor"
                        />
                    ),
                },
                {
                    description: "Content Background Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Content Background Color"
                            path="contentBgColor"
                        />
                    ),
                },
            ],
        },
        buildBorderSection(),
    ],
};
