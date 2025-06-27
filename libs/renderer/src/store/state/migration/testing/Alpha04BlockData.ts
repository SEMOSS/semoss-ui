export const Alpha04BlockData = {
    queries: {
        "ask-llm": {
            id: "ask-llm",
            cells: [
                {
                    id: "42377",
                    widget: "code",
                    parameters: {
                        code: 'LLM(engine = "4acbe913-df40-4ac0-b28a-daa5ad91b172", command = "<encode>What is the average home price in {{country}} {{province}} with the latest data that you have.  REQUIRED: Just respond with a number nothing else</encode>", paramValues=[{}]);',
                        type: "pixel",
                    },
                },
                {
                    id: "99842",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "{{unformatted-resp}}['response']",
                    },
                },
            ],
        },
    },
    blocks: {
        "welcome-container-block": {
            parent: {
                id: "page-1",
                slot: "content",
            },
            slots: {
                children: {
                    children: ["input--2132"],
                    name: "children",
                },
            },
            widget: "container",
            data: {
                style: {
                    padding: "4px",
                    overflow: "hidden",
                    flexWrap: "wrap",
                    flexDirection: "column",
                    display: "flex",
                    gap: "8px",
                },
            },
            listeners: {},
            id: "welcome-container-block",
        },
        "page-1": {
            slots: {
                content: {
                    children: [
                        "markdown--5580",
                        "input--607",
                        "welcome-container-block",
                        "button--1258",
                        "button--63",
                        "markdown--1585",
                    ],
                    name: "content",
                },
            },
            widget: "page",
            data: {
                style: {
                    padding: "24px",
                    fontFamily: "roboto",
                    flexDirection: "column",
                    display: "flex",
                    gap: "8px",
                },
                route: "",
            },
            listeners: {
                onPageLoad: [],
            },
            id: "page-1",
        },
        "input--2132": {
            id: "input--2132",
            widget: "input",
            parent: {
                id: "welcome-container-block",
                slot: "children",
            },
            data: {
                style: {
                    width: "100%",
                    padding: "4px",
                },
                value: "",
                label: "Province",
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
                content: {
                    name: "content",
                    children: [],
                },
            },
        },
        "markdown--5580": {
            id: "markdown--5580",
            widget: "markdown",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    padding: "4px",
                },
                markdown:
                    "# Average Home Price Finder\n\n##### This App will use the LLM to get you the Average home price for a particular city/state",
            },
            listeners: {},
            slots: {},
        },
        "markdown--1585": {
            id: "markdown--1585",
            widget: "markdown",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    padding: "4px",
                },
                markdown: "{{average-home-price}}",
            },
            listeners: {},
            slots: {},
        },
        "button--1258": {
            id: "button--1258",
            widget: "button",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {},
                label: "Find Average Home Price",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
            },
            listeners: {
                onClick: [
                    {
                        message: "RUN_QUERY",
                        payload: {
                            queryId: "ask-llm",
                        },
                    },
                ],
            },
            slots: {},
        },
        "button--63": {
            id: "button--63",
            widget: "button",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {},
                label: "Dispatch output",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
                show: true,
            },
            listeners: {
                onClick: [
                    {
                        message: "DISPATCH_OUTPUTS_EVENT",
                        payload: {},
                    },
                ],
            },
            slots: {},
        },
        "input--607": {
            id: "input--607",
            widget: "input",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    width: "100%",
                    padding: "4px",
                },
                value: "",
                label: "Country",
                hint: "",
                type: "text",
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                show: "true",
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
    },
    variables: {
        "unformatted-resp": {
            type: "cell",
            to: "ask-llm",
            cellId: "42377",
        },
        "average-home-price": {
            type: "query",
            to: "ask-llm",
            isOutput: true,
        },
        country: {
            type: "block",
            to: "input--607",
            isInput: true,
            isOutput: false,
        },
        province: {
            type: "block",
            to: "input--2132",
            isInput: true,
        },
    },
    executionOrder: ["ask-llm"],
    version: "1.0.0-alpha.4",
};
