import { TableChart } from "@mui/icons-material";

import { Autocomplete, Stack, TextField } from "@semoss/ui";

import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { BlockComponent, BlockConfig } from "../../../store";
import { useBlock, useBlockSettings, useBlocksPixel } from "../../../hooks";
import {
    GridDynamicFrameBlockDef,
    GridDynamicFrameBlock,
} from "./GridDynamicFrameBlock";
import { buildDimensionsSection } from "../block-defaults.shared";
import { DynamicGridMenu } from "../../../components/block-settings";

// export the config for the block
export const config: BlockConfig<GridDynamicFrameBlockDef> = {
    widget: "grid-dynamic-frame",
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: "",
        },
        columns: [],
        style: {
            display: "flex",
            flexDirection: "row",
            padding: "",
            gap: "",
            flexWrap: "wrap",
            width: "450px",
            height: "350px",
        },
        view: {
            pagination: true,
        },
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
        },
        show: true,
    },

    listeners: {},
    slots: {},
    render: GridDynamicFrameBlock,
    icon: TableChart,

    contentMenu: [
        {
            name: "Data",
            children: [
                {
                    description: "Layout",
                    render: ({ id }) => <DynamicGridMenu id={id} />,
                },
            ],
        },
    ],
    styleMenu: [buildDimensionsSection()],
};
