import { Insights } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import { VisualizationBlockMenu } from "./VisualizationBlockMenu";
import {
    VisualizationBlock,
    EchartVisualizationBlockDef,
} from "./VisualizationBlock";

export const config: BlockConfig<EchartVisualizationBlockDef> = {
    widget: "e-chart",
    type: BLOCK_TYPE_CHART,
    data: {
        style: {
            display: "flex",
            // flexDirection: 'column',
            padding: "4px",
            gap: "8px",
            // flexWrap: 'wrap',
            width: 450,
            height: 350,
        },
        option: {},
        variation: "",
        frame: {
            name: "",
        },
        columns: [],
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
            hideExclude: false,
        },
        show: true,
    },
    listeners: {},
    slots: {},
    render: VisualizationBlock,
    icon: Insights,
    menu: VisualizationBlockMenu,
};
