import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { GmailBlockDef, GmailBlock } from "./GmailBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
export const config: BlockConfig<GmailBlockDef> = {
    widget: "gmailtext",
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: "Gmail Block",
        isStreaming: false,
        show: "true",
        showGmailSendForm: false,
        showSendForm: false,
        // showDocsUpdateForm: boolean;
        // showUpdateForm: boolean;
        showGmailReadForm: false,
        showReadForm: false,
        showGmailDeleteForm: false,
        showDeleteForm: false,
        listAllGmails: false,
        listedGmails: false,
        title: "",
        content: "",
        gmailConnectionValue: "",
        gmailActionValue: "",
        gmailTitleValue: "",
    },
    listeners: {},
    slots: {},
    render: GmailBlock,
    // icon: TextFields,
    // styleMenu: [],
};
