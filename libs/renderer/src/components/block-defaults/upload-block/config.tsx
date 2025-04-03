import { CSSProperties } from "react";
import { BlockConfig } from "../../../store";

import { UploadBlockDef, UploadBlock } from "./UploadBlock";
import { Upload } from "@mui/icons-material";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import { InputSettings, QuerySelectionSettings } from "../../block-settings";
import { UploadSettings } from "../../block-settings/shared/UploadSettings";
import { SelectSettings } from "../../block-settings/shared/SelectSettings";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
export const DefaultStyles: CSSProperties = {
    width: "100%",
    padding: "4px",
};

export const FileTypes: string[] = [
    ".csv",
    ".txt",
    ".jpeg",
    ".png",
    ".gif",
    ".mp3",
    ".m4a",
    ".wav",
    ".mp4",
    ".mov",
    ".avi",
    ".zip",
    ".rar",
    ".pdf",
    ".docx",
    ".xlx",
    ".xlsx",
    ".bat",
    ".cmd",
    ".sh",
    ".img",
    ".iso",
    ".dmg",
    ".js",
];

// export the config for the block
export const config: BlockConfig<UploadBlockDef> = {
    widget: "upload",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        value: "",
        label: "Example Input",
        hint: "",
        extensions: [],
        loading: false,
        disabled: false,
        required: false,
        multiple: false,
        show: "true",
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: UploadBlock,
    icon: Upload,
    contentMenu: [
        {
            name: "General",
            children: [
                ...buildShowField(),
                {
                    description: "Value",
                    render: ({ id }) => (
                        <UploadSettings
                            id={id}
                            label="Value"
                            path={"value"}
                            restrictPath={"extensions"}
                        />
                    ),
                },
                {
                    description: "Extensions",
                    render: ({ id }) => (
                        <SelectSettings
                            id={id}
                            label="Extensions"
                            path={"extensions"}
                            options={FileTypes}
                        />
                    ),
                },
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: "Hint",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: "Loading",
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
                {
                    description: "Multiple Files",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Multiple Files"
                            path="multiple"
                        />
                    ),
                },
            ],
        },
        {
            name: "on Change",
            children: [...buildListener("onChange")],
        },
    ],
    styleMenu: [],
};
