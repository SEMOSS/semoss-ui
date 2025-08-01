import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { JiraBlockDef, JiraBlock } from "./JiraBlock";
import { TextFields } from "@mui/icons-material";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<JiraBlockDef> = {
    widget: "jira",
    type: 'jira',
    data: {
        style: DefaultStyles,
        text: "Jira Block",
        isStreaming: false,
        show: "true",
        showCreateJiraForm: false,
        listAllTickets: false,
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: JiraBlock,
};