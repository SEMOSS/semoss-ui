import { BlockConfig } from "../../../store";
import {VisualizationFilterBlockDef, VisualizationFilterBlock} from './VisualizationFilterBlock';
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
        filterType: "",
        show: "true",
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
    // contentMenu: [
    //     {
    //         name: "General",
    //         children: [
    //             {
    //                 description: "Text",
    //                 render: ({ id }) => (
    //                     <InputSettings id={id} label="Text" path="text" />
    //                 ),
    //             },
    //             {
    //                 description: "Destination",
    //                 render: ({ id }) => (
    //                     <InputSettings
    //                     id={id}
    //                     label="Destination"
    //                     path="href"
    //                     />
    //                 ),
    //             },
    //         ],
    //     },
    //     {
    //         name: "Conditional",
    //         children: [...buildShowField()],
    //     },
    //     {
    //         name: "Pre Process",
    //         children: [...buildListener("preProcess")],
    //     },
    // ],
    // styleMenu: [buildTypographySection(), buildTextAlignSection()],
    menu: VisualizationFilterMenu
};
