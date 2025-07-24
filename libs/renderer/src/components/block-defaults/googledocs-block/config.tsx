import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { GoogleDocsBlockDef, GoogleDocsBlock } from "./GoogleDocsBlock";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};
export const config: BlockConfig<GoogleDocsBlockDef> = {
    widget: "googledocstext",
    type: BLOCK_TYPE_DISPLAY,
    data: {
         style: DefaultStyles,
        text: "Google Docs Block",
        isStreaming: false,
        show: "true",
        showDocsCreateForm: false,
        showCreateForm: false,
        showDocsUpdateForm: false,
        showUpdateForm: false,
        showDocsDeleteForm: false,
        showDeleteForm: false,
        
    },
    listeners: {},
    slots: {},
    render: GoogleDocsBlock,
};