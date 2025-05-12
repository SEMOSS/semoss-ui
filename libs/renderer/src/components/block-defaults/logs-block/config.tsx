import { BlockConfig } from "../../../store";
import { LogsBlockDef, LogsBlock } from "./LogsBlock";
import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { QueryNameDropdownSettings } from "../../block-settings/custom/QueryNameDropdownSettings";
import { buildShowField } from "../block-defaults.shared";

export const config: BlockConfig<LogsBlockDef> = {
    widget: "logs",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        queryId: "",
        show: "true",
    },
    listeners: {},
    slots: {},
    render: LogsBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
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
    ],
    styleMenu: [],
};
