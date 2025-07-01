import { BlockConfig } from "../../../store";
import { TableChart } from "@mui/icons-material";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { GridBlockMenu } from "./GridBlockMenu";
import { GridBlockDef, GridBlock } from "./GridBlock";

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
    render: GridBlock,
    icon: TableChart,
    menu: GridBlockMenu,
};
