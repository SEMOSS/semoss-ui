import { BlockConfig } from "../../../store";
import {
    VisualizationFilterBlockDef,
    VisualizationFilterBlock,
} from "./VisualizationFilterBlock";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import { VisualizationFilterMenu } from "./VisualizationFilterMenu";

import { Link } from "@mui/icons-material";

export const config: BlockConfig<VisualizationFilterBlockDef> = {
    widget: "visualization-filter",
    type: BLOCK_TYPE_CHART,
    data: {
        style: {
            padding: "4px",
            whiteSpace: "pre-line",
            textOverflow: "ellipsis",
        },
        displayType: "",
        frame: "",
        column: "",
        showPanelTitle: false,
        searchable: false,
        multipleSelection: false,
        show: "true",
        filterLabel: "",
        sliderSensitivity: 0,
        listOptions: [],
        selectedValues: [],
        color: "secondary",
        size: "medium",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: VisualizationFilterBlock,
    icon: Link,
    menu: VisualizationFilterMenu,
};
