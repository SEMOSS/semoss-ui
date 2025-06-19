import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import {
    buildTypographySection,
    buildTextAlignSection,
    buildShowField,
    buildListener,
} from "../block-defaults.shared";
import { JiraBlockDef, JiraBlock } from "./JiraBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import { QueryInputSettings,JiraSettings } from "../../block-settings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<JiraBlockDef> = {
    widget: "jiratext",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Jira Block",
        isStreaming: false,
        show: "true",
        showCreateJiraForm: false,
        showCreatedJiraForm: false,
        listAllTickets: false,
        listedTickets: false,
        userId: '',
    },
    listeners: {},
    slots: {},
    render: JiraBlock,
    icon: TextFields,
    contentMenu: [
        {
            name: "Jira Settings",
            children: [
                {
                    description: "Text",
                    render: ({ id }) => (
                        <JiraSettings id={id} paths={['showCreateJiraForm','showCreatedJiraForm','listAllTickets','listedTickets']} userId="userId"/>
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
