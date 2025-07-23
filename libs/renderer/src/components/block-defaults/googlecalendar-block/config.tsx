import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { GoogleCalendarBlockDef, GoogleCalendarBlock } from "./GoogleCalendarBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<GoogleCalendarBlockDef> = {
    widget: "googlecalendartext",
    type: BLOCK_TYPE_DISPLAY,
    data: {
         style: DefaultStyles,
        text: "Google Calendar Block",
        isStreaming: false,
        show: "true",
        showCalendarCreateForm: false,
        showCreateForm: false,
        showCalendarUpdateForm: false,
        showUpdateForm: false,
        showCalendarReadForm: false,
        showReadForm: false,
        showCalendarDeleteForm: false,
        showDeleteForm: false,
        listAllCalendar: false,
        listedCalendar: false,
        googlecalendarConnectionValue: '',
        googlecalendarActionValue: '',
        calendarSummaryValue: '',

    },
    listeners: {},
    slots: {},
    render: GoogleCalendarBlock,
};