import { BlockJSON } from "../../store";
import type { DesignerMenuItem } from "./menu-types";
import { lightTheme } from "@semoss/ui";

const SECTION_ELEMENT = "Element";
const SECTION_INPUT = "Input";
const SECTION_LAYOUT = "Layout";
const SECTION_PROGRESS = "Progress";
const SECTION_TEXT = "Text";
const SECTION_COMPARE_LLMS = "Compare LLMs";
const SECTION_MERMAID = "Mermaid";
const SECTION_THEME = "Theme";

export const DEFAULT_MENU: DesignerMenuItem[] = [
    {
        section: SECTION_THEME,
        name: "Theme Block",
        json: {
            widget: "theme",
            data: {
                theme: lightTheme,
            },
            listeners: {},
            slots: {
                children: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: "Audio Player",
        json: {
            widget: "audio-player",
            data: {
                label: "Audio Player",
                autoplay: false,
                controls: true,
                loop: false,
                source: "",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_INPUT,
        name: "Button",
        json: {
            widget: "button",
            data: {
                style: {},
                label: "Submit",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
            },
            listeners: {
                onClick: [],
            },
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_INPUT,
        name: "Checkbox",
        json: {
            widget: "checkbox",
            data: {
                style: {
                    padding: "none",
                },
                label: "Example Checkbox",
                required: false,
                disabled: false,
                value: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_INPUT,
        name: "Radio",
        json: {
            widget: "radio",
            data: {
                style: {
                    padding: "4px",
                },
                value: "no_value",
                label: "Radio Input",
                isGroup: false,
                options: [{ label: "Default", value: "no_value" }],
                size: "medium",
                direction: "column",
                color: "primary",
                labelPlacement: "end",
                required: false,
                disabled: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_LAYOUT,
        name: "Modal",
        json: {
            widget: "modal",
            data: {
                style: {},
                title: "Modal Title",
                open: false,
                fullWidth: true,
                maxWidth: "sm",
                minWidth: "sm",
                designMode: true,
            },
            listeners: {
                onSubmit: [],
            },
            slots: {
                content: [],
                footer: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: "Input",
        json: {
            widget: "input",
            data: {
                style: {
                    width: "100%",
                    padding: "4px",
                },
                value: "",
                label: "Example Input",
                hint: "",
                type: "text",
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: "Audio Input",
        json: {
            widget: "audio-input",
            data: {
                style: {
                    width: "50px",
                    height: "60px",
                },
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
                value: "",
                mode: "transcribe",
            },
            listeners: {
                onClick: [],
            },
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_INPUT,
        name: "Select",
        json: {
            widget: "select",
            data: {
                style: {
                    padding: "4px",
                },
                value: "",
                label: "Example Select Input",
                hint: "",
                options: [],
                required: false,
                disabled: false,
                loading: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: "Upload",
        json: {
            widget: "upload",
            data: {
                style: {
                    width: "100%",
                    padding: "4px",
                },
                value: "",
                label: "Example Input",
                hint: "",
                loading: false,
                disabled: false,
                required: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_LAYOUT,
        name: "Container",
        json: {
            widget: "container",
            data: {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    padding: "4px",
                    gap: "8px",
                    flexWrap: "wrap",
                },
            },
            listeners: {},
            slots: {
                children: [],
            },
        },
    },
    {
        section: SECTION_PROGRESS,
        name: "Progress",
        json: {
            widget: "progress",
            data: {
                type: "linear",
                value: 50,
                includeLabel: true,
                size: "300px",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: "Iframe",
        json: {
            widget: "iframe",
            data: {
                style: {},
                src: "",
                title: "",
                enableFrameInteractions: true,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: "PDF Viewer",
        json: {
            widget: "pdfViewer",
            data: {
                style: {
                    width: "100%",
                    height: "82%",
                    padding: "8px",
                },
                selectedPdf: null,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: "Image",
        json: {
            widget: "image",
            data: {
                style: {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "200px",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                },
                src: "",
                title: "",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Logs",
        json: {
            widget: "logs",
            data: {
                style: {},
                queryId: "",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_INPUT,
        name: "Toggle Button",
        json: {
            widget: "toggle-button",
            data: {
                disabled: false,
                color: "primary",
                size: "small",
                options: [
                    {
                        display: "on",
                        value: "on",
                    },
                    {
                        display: "off",
                        value: "off",
                    },
                ],
                value: null,
                mandatory: true,
                multiple: false,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    // {
    //     section: SECTION_INPUT,
    //     name: 'Stepper',
    //     json: {
    //         widget: 'stepper',
    //         data: {
    //             steps: [],
    //         },
    //         listeners: {},
    //         slots: {} as BlockJSON['slots'],
    //     },
    // },
    {
        section: SECTION_TEXT,
        name: "Link",
        json: {
            widget: "link",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                href: "",
                text: "Insert text",
            },
            listeners: {},
            slots: {},
        },
    },
    {
        section: SECTION_TEXT,
        name: "Markdown",
        json: {
            widget: "markdown",
            data: {
                style: {
                    padding: "4px",
                },
                markdown: "**Hello world**",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: "HTML",
        json: {
            widget: "html",
            data: {
                style: {
                    padding: "4px",
                },
                // default html includes place-holder text and basic styling
                html: "<html>\r\n    <style>\r\n        html {\r\n            font-family: Roboto;\r\n            text-align: center;\r\n            overflow: hidden;\r\n        }\r\n    </style>\r\n    <body>\r\n        <h2>HTML Block</h2>\r\n    </body>\r\n</html>",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                    color: "rgb(0,76,255)",
                    fontFamily: "Times New Roman",
                },
                text: "Hello world",
                variant: "h1",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h1",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h2",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h3",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h4",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h5",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "h6",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Hello world",
                variant: "p",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_TEXT,
        name: "Text",
        json: {
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                    fontStyle: "italic",
                },
                text: "Hello world",
                variant: "p",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_COMPARE_LLMS,
        name: "Compare LLMs",
        json: {
            widget: "llmComparison",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "",
                variants: {},
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Mermaid",
        json: {
            widget: "mermaid",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Query",
                variant: "p",
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
];
