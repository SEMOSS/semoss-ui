import { InsertEmoticon } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { ColorSettings, SelectInputSettings } from "../../block-settings";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { IconBlockDef, IconBlock } from "./IconBlock";
import {
    buildDimensionsSection,
    buildListener,
    buildShowField,
} from "../block-defaults.shared";
import {
    inputOptions,
    IconSelectSettings,
} from "../../block-settings/custom/IconSelectSettings";

export const config: BlockConfig<IconBlockDef> = {
    widget: "icon",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "200px",
            color: "black",
        },
        icon: "Default",

        src: "",
        title: "",
        show: "true",
    },
    listeners: {},
    slots: {},
    render: IconBlock,
    icon: InsertEmoticon,
    contentMenu: [
        {
            name: "Select Icon",
            children: [
                ...buildShowField(),
                {
                    description: "Icon",
                    render: ({ id }) => (
                        <IconSelectSettings
                            id={id}
                            label="Icon"
                            path="icon"
                            options={inputOptions}
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: "Color",
            children: [
                {
                    description: "Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Color"
                            path="style.color"
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
};
