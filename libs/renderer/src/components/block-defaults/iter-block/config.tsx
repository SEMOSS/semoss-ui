import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { ChildBlockSettings, InputSettings, QueryInputSettings, QuerySelectionSettings } from "../../block-settings";

import { IterBlockDef, IterBlock } from "./IterBlock";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { FormatShapes } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import { InputModalSettings } from "../../block-settings/shared/InputModalSettings";
import { useBlock } from "@/hooks";

// export the config for the block
export const config: BlockConfig<IterBlockDef> = {
    widget: "iter",
    type: BLOCK_TYPE_INPUT,
    data: {},
    listeners: {},
    slots: {
        children: [],
    },
    render: IterBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: "Conditional",
            children: [
                ...buildShowField(),     
            ],
        },
        {
            name: "Data Source",
            children: [
                {
                    description: "Data Source",
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Source" path="source" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
