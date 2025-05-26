import { HighlightAlt } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { LogsBlockDef, LogsBlock } from "./LogsBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { QueryNameDropdownSettings } from "../../block-settings/custom/QueryNameDropdownSettings";
import { buildShowField, buildListener } from "../block-defaults.shared";

export const config: BlockConfig<LogsBlockDef> = {
    widget: "logs",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        queryId: "",
        show: "true",
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {},
    render: LogsBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Sheet",
                    render: ({ id }) => (
                        <QueryNameDropdownSettings
                            id={id}
                            label="Query"
                            path="queryId"
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
    ],
    styleMenu: [],
};
