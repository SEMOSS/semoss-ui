import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { SpreadsheetBlockDef, SpreadsheetBlock } from "./SpreadsheetBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

export const config: BlockConfig<SpreadsheetBlockDef> = {
    widget: "spreadsheet",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Spreadsheet Block",
        isStreaming: false,
        show: "true",
        showSpreadSheetForm: false,
        showCreateSheetForm: false,
        showUpdateSheetForm: false,
        deleteTitleSheet: false,
        showListedSheets: false,
        titleSheetName: '',
        sheetName: '',
    },
    listeners: {},
    slots: {},
    render: SpreadsheetBlock,
};