export const migrationDemoData = {
    queries: {
        "get-databases": {
            id: "get-databases",
            cells: [
                {
                    id: "32977",
                    widget: "code",
                    parameters: {
                        code: 'MyEngines(engineTypes="DATABASE");',
                        type: "pixel",
                    },
                },
            ],
        },
        "query-data": {
            id: "query-data",
            cells: [
                {
                    id: "55764",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "table_def = '''\r\nCREATE TABLE diabetes (\r\nage int,\r\ngender varchar(50),\r\nframe varchar(50),\r\n)'''\r\ntable_def",
                    },
                },
                {
                    id: "50613",
                    widget: "code",
                    parameters: {
                        code: "sql_gen_prompt = ''\r\n\r\nsql_gen_prompt += '''You are a helpful assistant specialising in data analytics. Answer the questions by providing SQL code that will run on Microsoft SQL Server.\r\n\r\n'''\r\n\r\nsql_gen_prompt += '''This is the question you need to answer:\r\n\r\n'''\r\n\r\nsql_gen_prompt += '''{{user-prompt}}\r\n\r\n'''\r\n\r\nsql_gen_prompt += '''Here is the relevant database schema:\r\n'''\r\n\r\nsql_gen_prompt += '''{{table_def}}\r\n\r\n'''\r\n\r\nsql_gen_prompt += '''Your response should only include a SQL query.'''\r\n\r\nsql_gen_prompt",
                        type: "py",
                    },
                },
                {
                    id: "50",
                    widget: "code",
                    parameters: {
                        type: "pixel",
                        code: "LLM(engine = \"{{model}}\", command = \"<encode>{{sql-gen-prompt}}</encode>\", paramValues = [ {'max_completion_tokens':2000,'temperature':0.3} ]);",
                    },
                },
                {
                    id: "50582",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: "{{model-resp}}['response']",
                    },
                },
            ],
        },
        "test-queries": {
            id: "test-queries",
            cells: [
                {
                    id: "1727",
                    widget: "code",
                    parameters: {
                        code: "sql = {{model-resp}}['response']\r\n\r\nsql.replace('```','').replace('sql','')",
                        type: "py",
                    },
                },
                {
                    id: "71024",
                    widget: "code",
                    parameters: {
                        type: "py",
                        code: 'import json \r\n\r\na = json.loads("""{{selected-database}}""")\r\na[\'database_id\']',
                    },
                },
                {
                    id: "7376",
                    widget: "code",
                    parameters: {
                        type: "pixel",
                        code: 'Database ( database = [ \'{{db_id}}\' ] ) | \r\nQuery ("<encode> {{sql-query}}  </encode>") | Import ( frame = [ CreateFrame ( frameType = [ "PY" ] , override = [ true ] ) .as ( [ "FRAME_31282" ] ) ] ) ; \r\n\r\n',
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
                    children: ["welcome-text-block"],
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
            listeners: {
                preProcess: {
                    type: "sync",
                    order: [],
                },
            },
            id: "welcome-container-block",
        },
        "page-1": {
            slots: {
                content: {
                    children: [
                        "welcome-container-block",
                        "select--6397",
                        "input--2637",
                        "button--7423",
                        "text--1620",
                        "button--4700",
                        "grid--4714",
                    ],
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
            },
            listeners: {
                onPageLoad: {
                    type: "sync",
                    order: [
                        {
                            message: "RUN_QUERY",
                            payload: {
                                queryId: "get-databases",
                            },
                        },
                    ],
                },
            },
            id: "page-1",
        },
        "welcome-text-block": {
            parent: {
                id: "welcome-container-block",
                slot: "children",
            },
            slots: {},
            widget: "text",
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    overflow: "auto",
                    textOverflow: "ellipsis",
                },
                text: "Welcome to the UI Builder! Drag and drop blocks to use in your app.",
            },
            listeners: {
                preProcess: {
                    type: "sync",
                    order: [],
                },
            },
            id: "welcome-text-block",
        },
        "select--6397": {
            id: "select--6397",
            widget: "select",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    padding: "4px",
                },
                value: '{"database_date_created":"2024-10-16 15:04:53","app_type":"DATABASE","app_subtype":"H2_DB","database_name":"diabetes use case","low_database_name":"diabetes use case","database_favorite":0,"permission":1,"database_type":"DATABASE","app_name":"diabetes use case","database_id":"a63cd720-590e-4518-987c-c0693bdf3198","database_cost":"$","database_discoverable":false,"user_permission":1,"database_global":false,"app_favorite":0,"app_id":"a63cd720-590e-4518-987c-c0693bdf3198","database_subtype":"H2_DB","app_cost":"$"}',
                label: "Example Select Input",
                hint: "",
                options: "{{get-databases--32977.output}}",
                required: false,
                disabled: false,
                loading: false,
                show: "true",
                optionLabel: "database_name",
            },
            listeners: {
                preProcess: {
                    type: "sync",
                    order: [],
                },
                onChange: {
                    type: "sync",
                    order: [],
                },
            },
            slots: {
                content: {
                    name: "content",
                    children: [],
                },
            },
        },
        "input--2637": {
            id: "input--2637",
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
                value: "list all ages",
                label: "Example Input",
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
                preProcess: {
                    type: "sync",
                    order: [],
                },
                onChange: {
                    type: "sync",
                    order: [],
                },
            },
            slots: {
                content: {
                    name: "content",
                    children: [],
                },
            },
        },
        "button--7423": {
            id: "button--7423",
            widget: "button",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {},
                label: "generate sql",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
                show: true,
            },
            listeners: {
                onClick: {
                    type: "sync",
                    order: [
                        {
                            message: "RUN_QUERY",
                            payload: {
                                queryId: "query-data",
                            },
                        },
                    ],
                },
                preProcess: {
                    type: "sync",
                    order: [],
                },
            },
            slots: {},
        },
        "button--4700": {
            id: "button--4700",
            widget: "button",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {},
                label: "extract data",
                loading: false,
                disabled: false,
                variant: "contained",
                color: "primary",
                show: true,
            },
            listeners: {
                onClick: {
                    type: "sync",
                    order: [
                        {
                            message: "RUN_QUERY",
                            payload: {
                                queryId: "test-queries",
                            },
                        },
                    ],
                },
                preProcess: {
                    type: "sync",
                    order: [],
                },
            },
            slots: {},
        },
        "grid--4714": {
            id: "grid--4714",
            widget: "grid",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                frame: {
                    name: "FRAME_31282",
                },
                columns: [],
                view: {
                    pagination: true,
                },
            },
            listeners: {},
            slots: {},
        },
        "text--1620": {
            id: "text--1620",
            widget: "text",
            parent: {
                id: "page-1",
                slot: "content",
            },
            data: {
                style: {
                    padding: "4px",
                    whiteSpace: "pre-line",
                    textOverflow: "ellipsis",
                },
                text: " {{query-data}} ",
                variant: "p",
                show: "true",
            },
            listeners: {
                preProcess: {
                    type: "sync",
                    order: [],
                },
            },
            slots: {},
        },
    },
    variables: {
        "get-databases": {
            type: "query",
            to: "get-databases",
            isOutput: true,
        },
        "get-databases--32977": {
            type: "cell",
            to: "get-databases",
            cellId: "32977",
        },
        "query-data": {
            type: "query",
            to: "query-data",
            isOutput: true,
        },
        "query-data--50582": {
            type: "cell",
            to: "query-data",
            cellId: "50582",
        },
        "user-prompt": {
            type: "block",
            to: "input--2637",
            isInput: true,
            isOutput: false,
        },
        table_def: {
            type: "cell",
            to: "query-data",
            cellId: "55764",
            isInput: false,
            isOutput: false,
        },
        "test-queries": {
            type: "query",
            to: "test-queries",
            isOutput: true,
        },
        "sql-query": {
            type: "cell",
            to: "test-queries",
            cellId: "1727",
            isInput: false,
            isOutput: false,
        },
        "selected-database": {
            type: "block",
            to: "select--6397",
            isInput: true,
            isOutput: false,
        },
        model: {
            type: "model",
            value: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
        },
        "model-resp": {
            type: "cell",
            to: "query-data",
            cellId: "50",
            isInput: false,
            isOutput: false,
        },
        "test-queries--7376": {
            type: "cell",
            to: "test-queries",
            cellId: "7376",
        },
        "sql-gen-prompt": {
            type: "cell",
            to: "query-data",
            cellId: "50613",
            isInput: false,
            isOutput: false,
        },
        db_id: {
            type: "cell",
            to: "test-queries",
            cellId: "71024",
            isInput: false,
            isOutput: false,
        },
    },
    executionOrder: ["get-databases", "query-data", "test-queries"],
    version: "1.0.0-alpha.8",
};
