import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { ChildBlockSettings, InputSettings, QueryInputSettings, QuerySelectionSettings } from "../../block-settings";

import { IterationBlockDef, IterationBlock } from "./IterationBlock";
import { buildLayoutSection, buildListener, buildShowField } from "../block-defaults.shared";
import { FormatShapes } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import { InputModalSettings } from "../../block-settings/shared/InputModalSettings";
import { useBlock } from "@/hooks";

// export the config for the block
export const config: BlockConfig<IterationBlockDef> = {
    widget: "iteration",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        source: "",
        child: null,
        show: "true"
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: IterationBlock,
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
        // {
        //     name: "Child Block",
        //     children: [
        //         {
        //             description: "Child",
        //             render: ({ id }) => (
        //                 <ChildBlockSettings id={id} />
        //             ),
        //         },
        //     ],
        // },
    ],
    styleMenu: [
        buildLayoutSection(),
    ],
};
