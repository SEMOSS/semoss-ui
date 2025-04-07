import { BlockConfig } from "../../../store";
import { TableChart } from "@mui/icons-material";
import { SizeSettings } from "../../block-settings";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { GridBlock, GridBlockDef } from "./GridBlock";
import { GridBlockColumnSettings } from "./GridBlockColumnSettings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { VisualizationBlockMenu } from "../echart-visualization-block/VisualizationBlockMenu";
import { GridBlockMenu } from "./GridBlockMenu";

// export the config for the block
export const config: BlockConfig<GridBlockDef> = {
    widget: "grid",
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: "",
        },
        option: {},
        columns: [],
        variation: "grid-block",
        style: {
            display: "flex",
            // flexDirection: 'column',
            padding: "4px",
            gap: "8px",
            // flexWrap: 'wrap',
            width: 450,
            height: 350,
        },
        view: {
            pagination: true,
        },
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
            // hideExclude: false,
        },
        show: true,
    },

    listeners: {},
    slots: {},
    render: GridBlock,
    icon: TableChart,
    menu: GridBlockMenu,
    // contentMenu: [
    //     {
    //         name: "General",
    //         children: [
    //             {
    //                 description: "Columns",
    //                 render: ({ id }) => <GridBlockColumnSettings id={id} />,
    //             },
    //             {
    //                 description: "Pagination",
    //                 render: ({ id }) => (
    //                     <SwitchSettings
    //                         id={id}
    //                         label="Pagination"
    //                         path="view.pagination"
    //                     />
    //                 ),
    //             },
    //         ],
    //     },
    // ],
    // styleMenu: [
    //     {
    //         name: "Dimensions",
    //         children: [
    //             {
    //                 description: "Width",
    //                 render: ({ id }) => (
    //                     <SizeSettings
    //                         id={id}
    //                         label="Width"
    //                         path="style.width"
    //                     />
    //                 ),
    //             },

    //             {
    //                 description: "Height",
    //                 render: ({ id }) => (
    //                     <SizeSettings
    //                         id={id}
    //                         label="Height"
    //                         path="style.height"
    //                     />
    //                 ),
    //             },
    //         ],
    //     },
    // ],
};
