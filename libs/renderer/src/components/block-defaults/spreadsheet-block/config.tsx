import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { SpreadsheetBlockDef, SpreadsheetBlock } from "./SpreadsheetBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import {SpreadsheetSettings}  from "../../block-settings";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<SpreadsheetBlockDef> = {
    widget: "spreadsheet",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Spreadsheet Block",
        isStreaming: false,
        show: "true",
        showReadSheetForm: false,
        showReadForm: false,
        showWriteSheetForm: false,
        showWriteForm: false,
        showUpdateSheetForm: false,
        showUpdateForm: false,
        showDeleteSheetForm: false,
        showDeleteForm: false,
        listAllTickets: false,
        listedTickets: false,
        userId: '',
        jiraConnectionValue: '',
        jiraActionValue: '',
    },
    listeners: {},
    slots: {},
    render: SpreadsheetBlock,
    icon: TextFields,
    contentMenu: [
        {
            name: "Spreadsheet Settings",
            children: [
                {
                    description: "Text",
                    render: ({ id }) => (
                        <SpreadsheetSettings id={id} paths={['showReadSheetForm','showReadForm','showWriteSheetForm','showWriteForm','showUpdateSheetForm','showUpdateForm','showDeleteSheetForm','showDeleteForm']} userId="userId" connections={["jiraConnectionValue","jiraActionValue"]}/>
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};