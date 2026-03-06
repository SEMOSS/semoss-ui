import { CSSProperties } from "react";
import { BlockConfig, BlockJSON } from "../../../store";
import { CalendarViewBlockDef, CalendarViewBlock } from "./CalendarViewBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<CalendarViewBlockDef> = {
    widget: "calendarviewtext",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Calendar View",
        isStreaming: false,
        source: undefined,
        calendarTitle: undefined,
        defaultDate: undefined,
        designMode: false, 
        events: [],
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        children: [] as BlockJSON[],
    },
    render: CalendarViewBlock,
};
