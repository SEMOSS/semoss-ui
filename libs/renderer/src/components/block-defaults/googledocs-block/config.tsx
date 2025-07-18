import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";
import { GoogleDocsBlockDef, GoogleDocsBlock } from "./GoogleDocsBlock";
import { TextFields } from "@mui/icons-material";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";

export const DefaultStyles: CSSProperties = {
    padding: "4px",
    whiteSpace: "pre-line",
    textOverflow: "ellipsis",
};

// export the config for the block
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
        showDocsReadForm: false,
        showReadForm: false,
        showDocsDeleteForm: false,
        showDeleteForm: false,
        listAllDocs: false,
        listedDocs: false,
        title: '',
        content: '',
        googledocsConnectionValue: '',
        googledocsActionValue: '',
        docsTitleValue: '',
        
    },
    listeners: {},
    slots: {},
    render: GoogleDocsBlock,
   // icon: TextFields,
   // styleMenu: [],
};