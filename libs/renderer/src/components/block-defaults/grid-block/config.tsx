import { BlockConfig } from "../../../store";
import { TableChart } from "@mui/icons-material";
import { SizeSettings } from "../../block-settings";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { GridBlock, GridBlockDef } from "./GridBlock";
import { GridBlockColumnSettings } from "./GridBlockColumnSettings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { buildShowField } from "../block-defaults.shared";

// export the config for the block
export const config: BlockConfig<GridBlockDef> = {
    widget: "grid",
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: "",
        },
        columns: [],
        style: {},
        view: {
            pagination: true,
        },
    },
    listeners: {},
    slots: {},
    render: GridBlock,
    icon: TableChart,
    contentMenu: [
        {
            name: "Conditional",
            children: [...buildShowField()],
        },
        {
            name: "General",
            children: [
                {
                    description: "Columns",
                    render: ({ id }) => <GridBlockColumnSettings id={id} />,
                },
                {
                    description: "Pagination",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Pagination"
                            path="view.pagination"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: "Dimensions",
            children: [
                {
                    description: "Width",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Width"
                            path="style.width"
                        />
                    ),
                },

                {
                    description: "Height",
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Height"
                            path="style.height"
                        />
                    ),
                },
            ],
        },
    ],
};
