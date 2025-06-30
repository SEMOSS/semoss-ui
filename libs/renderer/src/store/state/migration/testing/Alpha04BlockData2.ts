export const Alpha04BlockData2 = {
    queries: {
        "notebook-1": {
            id: "notebook-1",
            cells: [
                {
                    id: "13002",
                    widget: "code",
                    parameters: {
                        code: "py_bool = False\r\n\r\npy_bool",
                        type: "py",
                    },
                },
                {
                    id: "33216",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "true",
                    },
                },
                {
                    id: "47312",
                    widget: "code",
                    parameters: {
                        code: "py_bol = True\r\n\r\npy_bol",
                        type: "py",
                    },
                },
                {
                    id: "59781",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "0",
                    },
                },
                {
                    id: "20780",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "1",
                    },
                },
                {
                    id: "40165",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: 'import time\r\n\r\nstart_time = time.time()\r\nwhile time.time() - start_time < 5:\r\n    # Your code to be executed repeatedly within the 5-second interval goes here\r\n    # For example, you can print a message or perform some calculations\r\n    print("Running...")\r\n    time.sleep(1)  # Wait for 1 second to avoid excessive CPU usage\r\n\r\nprint("Finished running for 5 seconds.")\r\n"Finished"',
                    },
                },
                {
                    id: "48172",
                    widget: "code",
                    parameters: {
                        type: "pixel",
                        code: "true",
                    },
                },
                {
                    id: "59929",
                    widget: "code",
                    parameters: {
                        type: "pixel",
                        code: "false",
                    },
                },
                {
                    id: "37093",
                    widget: "code",
                    parameters: {
                        type: "pixel",
                        code: "true",
                    },
                },
            ],
        },
    },
    blocks: {
        "page-1": {
            slots: {
                content: {
                    children: ["container--6734"],
                    name: "content",
                },
            },
            widget: "page",
            data: {
                route: "",
                style: {
                    padding: "24px",
                    fontFamily: "roboto",
                    flexDirection: "column",
                    display: "flex",
                    gap: "8px",
                },
                loading: "{{notebook-1.isLoading}}",
            },
            listeners: {
                onPageLoad: [
                    {
                        message: "RUN_QUERY",
                        payload: {
                            queryId: "notebook-1",
                        },
                    },
                ],
            },
            id: "page-1",
        },
        "checkbox--4401": {
            id: "checkbox--4401",
            widget: "checkbox",
            parent: {
                id: "container--1621",
                slot: "children",
            },
            data: {
                style: {
                    padding: "none",
                },
                label: "Example Checkbox",
                required: false,
                disabled: false,
                value: true,
                route: "checkbox--4401",
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        "container--5880": {
            id: "container--5880",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    padding: "4px",
                    gap: "8px",
                    flexWrap: "wrap",
                    border: "3px solid #000000",
                },
                route: "container--5880",
                show: "{{checkbox--4401}}",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["button--1892"],
                },
            },
        },
        "text--5254": {
            id: "text--5254",
            widget: "text",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Show based off checkbox state",
                variant: "h1",
                route: "text--5254",
            },
            listeners: {},
            slots: {},
        },
        "input--7042": {
            id: "input--7042",
            widget: "input",
            parent: {
                id: "container--6734",
                slot: "children",
            },
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
                route: "input--7042",
                show: "{{notebook-1}}",
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: "content",
                    children: [],
                },
            },
        },
        "container--6734": {
            id: "container--6734",
            widget: "container",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    gap: "24px",
                    flexWrap: "wrap",
                    border: "2px solid #adadad",
                },
                route: "container--6734",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: [
                        "text--5254",
                        "container--1621",
                        "container--5880",
                        "text--8859",
                        "container--4360",
                        "text--1032",
                        "text--1201",
                        "divider--974",
                        "text--7107",
                        "container--6322",
                        "input--7042",
                        "container--9348",
                        "link--8114",
                        "divider--8773",
                        "text--440",
                        "container--3971",
                        "audio-input--8719",
                        "container--2962",
                        "accordion--3467",
                        "divider--380",
                    ],
                },
            },
        },
        "text--7107": {
            id: "text--7107",
            widget: "text",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Show based off notebook and cell variables",
                variant: "h1",
                route: "text--7107",
            },
            listeners: {},
            slots: {},
        },
        "text--5459": {
            id: "text--5459",
            widget: "text",
            parent: {
                id: "container--6322",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "{{notebook-1}} ",
                variant: "p",
                route: "text--5459",
            },
            listeners: {},
            slots: {},
        },
        "text--6081": {
            id: "text--6081",
            widget: "text",
            parent: {
                id: "container--6322",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some notebook variable:",
                variant: "p",
                route: "text--6081",
            },
            listeners: {},
            slots: {},
        },
        "container--6322": {
            id: "container--6322",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "0px",
                    gap: "8px",
                    flexWrap: "wrap",
                    backgroundColor: "#dedede",
                },
                route: "container--6322",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["text--6081", "text--5459"],
                },
            },
        },
        "button--1892": {
            id: "button--1892",
            widget: "button",
            parent: {
                id: "container--5880",
                slot: "children",
            },
            data: {
                style: {},
                label: "Just a button in a container",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
                show: true,
                route: "button--1892",
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        "container--1621": {
            id: "container--1621",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "4px",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "left",
                    alignItems: "center",
                },
                route: "container--1621",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["checkbox--4401", "text--5154"],
                },
            },
        },
        "text--5154": {
            id: "text--5154",
            widget: "text",
            parent: {
                id: "container--1621",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "{{checkbox--4401}}",
                variant: "p",
                route: "text--5154",
            },
            listeners: {},
            slots: {},
        },
        "divider--974": {
            id: "divider--974",
            widget: "divider",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "0px",
                    width: "100%",
                },
                variant: "fullWidth",
                orientation: "horizontal",
                textAlign: "center",
                flexItem: false,
                light: false,
                text: "",
                showText: true,
                route: "divider--974",
            },
            listeners: {},
            slots: {},
        },
        "text--8256": {
            id: "text--8256",
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some cell variable:",
                variant: "p",
                route: "text--8256",
            },
            listeners: {},
            slots: {},
        },
        "text--4767": {
            id: "text--4767",
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "{{notebook-1-cell-2}}",
                variant: "p",
                route: "text--4767",
            },
            listeners: {},
            slots: {},
        },
        "container--9348": {
            id: "container--9348",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "0px",
                    gap: "8px",
                    flexWrap: "wrap",
                    backgroundColor: "#dedede",
                },
                route: "container--9348",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["text--8256", "text--4767"],
                },
            },
        },
        "link--8114": {
            id: "link--8114",
            widget: "link",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                href: "",
                text: "Conditionally shown link",
                route: "link--8114",
                show: "{{notebook-1-cell-2}}",
            },
            listeners: {},
            slots: {},
        },
        "divider--8773": {
            id: "divider--8773",
            widget: "divider",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "0px",
                    width: "100%",
                },
                variant: "fullWidth",
                orientation: "horizontal",
                textAlign: "center",
                flexItem: false,
                light: false,
                text: "",
                showText: true,
                route: "divider--8773",
            },
            listeners: {},
            slots: {},
        },
        "text--440": {
            id: "text--440",
            widget: "text",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Show based off nb/cell properties",
                variant: "h1",
                route: "text--440",
            },
            listeners: {},
            slots: {},
        },
        "text--3880": {
            id: "text--3880",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some notebook property .isError",
                variant: "p",
                route: "text--3880",
            },
            listeners: {},
            slots: {},
        },
        "text--8689": {
            id: "text--8689",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: " {{cell-error-state.isError}} ",
                variant: "p",
                route: "text--8689",
            },
            listeners: {},
            slots: {},
        },
        "container--3971": {
            id: "container--3971",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "0px",
                    gap: "8px",
                    flexWrap: "wrap",
                    backgroundColor: "#ffa8a8",
                },
                route: "container--3971",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["text--3880", "text--8689"],
                },
            },
        },
        "text--567": {
            id: "text--567",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some cell property .isLoading",
                variant: "p",
                route: "text--567",
            },
            listeners: {},
            slots: {},
        },
        "text--5561": {
            id: "text--5561",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some cell property .isLoading",
                variant: "p",
                route: "text--5561",
            },
            listeners: {},
            slots: {},
        },
        "text--4932": {
            id: "text--4932",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "This is some cell property .isLoading:",
                variant: "p",
                route: "text--4932",
            },
            listeners: {},
            slots: {},
        },
        "text--7525": {
            id: "text--7525",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "{{long-running-cell.isLoading}}",
                variant: "p",
                route: "text--7525",
            },
            listeners: {},
            slots: {},
        },
        "container--2962": {
            id: "container--2962",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "0px",
                    gap: "8px",
                    flexWrap: "wrap",
                    backgroundColor: "#a8beff",
                },
                route: "container--2962",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["text--4932", "text--7525"],
                },
            },
        },
        "divider--380": {
            id: "divider--380",
            widget: "divider",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "0px",
                    width: "100%",
                },
                variant: "fullWidth",
                orientation: "horizontal",
                textAlign: "center",
                flexItem: false,
                light: false,
                text: "",
                showText: false,
                route: "divider--380",
            },
            listeners: {},
            slots: {},
        },
        "text--8859": {
            id: "text--8859",
            widget: "text",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Conditionally shown text",
                variant: "p",
                route: "text--8859",
                show: "{{checkbox--4401}}",
            },
            listeners: {},
            slots: {},
        },
        "checkbox--3603": {
            id: "checkbox--3603",
            widget: "checkbox",
            parent: null,
            data: {
                style: {
                    padding: "none",
                },
                label: "Example Checkbox",
                required: false,
                disabled: false,
                value: false,
                route: "checkbox--3603",
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        "text--5248": {
            id: "text--5248",
            widget: "text",
            parent: null,
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "{{checkbox--3603}}",
                variant: "p",
                route: "text--5248",
            },
            listeners: {},
            slots: {},
        },
        "container--4360": {
            id: "container--4360",
            widget: "container",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    display: "flex",
                    flexDirection: "row",
                    padding: "4px",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "left",
                    alignItems: "center",
                },
                route: "container--4360",
            },
            listeners: {},
            slots: {
                children: {
                    name: "children",
                    children: ["checkbox--3603", "text--5248"],
                },
            },
        },
        "text--1032": {
            id: "text--1032",
            widget: "text",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: "Conditionally shown text",
                variant: "p",
                route: "text--1032",
                show: "{{checkbox--3603}}",
            },
            listeners: {},
            slots: {},
        },
        "audio-input--8719": {
            id: "audio-input--8719",
            widget: "audio-input",
            parent: {
                id: "container--6734",
                slot: "children",
            },
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
                route: "audio-input--8719",
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        "accordion--3467": {
            id: "accordion--3467",
            widget: "accordion",
            parent: {
                id: "container--6734",
                slot: "children",
            },
            data: {
                style: {
                    padding: "20px",
                },
                triggerBgColor: "",
                contentBgColor: "",
                showExpandIcon: false,
                route: "accordion--3467",
                show: "true",
            },
            listeners: {},
            slots: {
                header: {
                    name: "header",
                    children: ["text--2665"],
                },
                content: {
                    name: "content",
                    children: [],
                },
            },
        },
        "text--2665": {
            id: "text--2665",
            widget: "text",
            parent: {
                id: "accordion--3467",
                slot: "header",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                    color: "#94a9ff",
                },
                text: "Accordion Show state",
                variant: "h1",
                route: "text--2665",
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {
        "checkbox--4401": {
            type: "block",
            to: "checkbox--4401",
        },
        "notebook-1": {
            type: "query",
            to: "notebook-1",
        },
        "notebook-1-cell-2": {
            type: "cell",
            to: "notebook-1",
            cellId: "59929",
        },
        "cell-error-state": {
            type: "cell",
            to: "notebook-1",
            cellId: "33216",
        },
        "long-running-cell": {
            type: "cell",
            to: "notebook-1",
            cellId: "40165",
        },
        "checkbox--3603": {
            type: "block",
            to: "checkbox--3603",
        },
        array: {
            type: "array",
            value: ["1"],
        },
    },
    executionOrder: ["notebook-1"],
    version: "1.0.0-alpha.4",
};
