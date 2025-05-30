import { FormatShapes } from "@mui/icons-material";

import { IterationBlockDef, IterationBlock } from "./IterationBlock";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { BlockConfig } from "../../../store";
import {
    buildLayoutSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";
import { QueryInputSettings } from "../../block-settings";

// export the config for the block
export const config: BlockConfig<IterationBlockDef> = {
    widget: "iteration",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        source: "",
        child: null,
        show: "true",
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
    render: IterationBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: "Data Source",
            children: [
                {
                    description: "Data Source",
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Source"
                            path="source"
                        />
                    ),
                },
            ],
        },
        {
            name: "Conditional",
            children: [...buildShowField()],
        },
        {
            name: "Pre Process",
            children: [...buildListener("preProcess")],
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
    styleMenu: [buildLayoutSection()],
};
