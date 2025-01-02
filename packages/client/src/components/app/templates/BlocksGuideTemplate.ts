import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import LANDINGPAGE from '@/assets/img/query.jpeg';

export const BlocksGuideTemplate: Template = {
    name: 'Variables Guide',
    description:
        'This is an app used to help you understand the usage of our variables within our drag and drop app  builder',
    image: LANDINGPAGE,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            default: {
                id: 'default',
                cells: [
                    {
                        id: '82164',
                        widget: 'code',
                        parameters: {
                            code: [
                                'print("--------------------------")',
                                "print('Engines')",
                                'print("--------------------------")',
                                'print("This is a LLM: " + "{{LLM}}")',
                                'print("This is a Vector: " + "{{Vector}}")',
                                'print("This is a DB: " + "{{DB}}")',
                                'print("--------------------------")',
                                "print('Data Types')",
                                'print("--------------------------")',
                                'print("{{string}}")',
                                'print("{{date}}")',
                                'print("--------------------------")',
                                "print('Queries')",
                                'print("--------------------------")',
                                'print("This is a query: " + "{{query}}")',
                                'print("This is a query output: " + "{{query.output}}")',
                                'print("This is a query executed: " + "{{query.isExecuted}}")',
                                'print("This is a query loading: " + "{{query.isLoading}}")',
                                'print("--------------------------")',
                                "print('Cells')",
                                'print("--------------------------")',
                                'print("This is a cell output: " + "{{cell.output}}")',
                                'print("This is a cell loading: " + "{{cell.isLoading}}" )',
                                'print("--------------------------")',
                                "print('Blocks')",
                                'print("--------------------------")',
                                'print("This is a block: " + "{{block}}")',
                                'print("This is a value property of the block: " + "{{block.value}}")',
                                'print("This is a label property of the block: " + "{{block.label}}")',
                            ],
                            type: 'py',
                        },
                    },
                    {
                        id: '1423',
                        widget: 'code',
                        parameters: {
                            code: '',
                            type: 'py',
                        },
                    },
                ],
            },
            python_code: {
                id: 'python_code',
                cells: [
                    {
                        id: '21756',
                        widget: 'code',
                        parameters: {
                            code: ['a = 56', 'b = 65', 'a+b'],
                            type: 'py',
                        },
                    },
                    {
                        id: '74964',
                        widget: 'code',
                        parameters: {
                            code: '"Output of Query"',
                            type: 'py',
                        },
                    },
                ],
            },
            'py-code': {
                id: 'py-code',
                cells: [
                    {
                        id: '70303',
                        widget: 'code',
                        parameters: {
                            code: '"this is some python code referenced by a Notebook sheet"',
                            type: 'py',
                        },
                    },
                ],
            },
        },
        blocks: {
            'text--6141': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h1',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Data Structure Variables',
                },
                listeners: {},
                id: 'text--6141',
            },
            'text--8076': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{py_code}}',
                },
                listeners: {},
                id: 'text--8076',
            },
            'text--8483': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{py_code.isExecuted}}',
                },
                listeners: {},
                id: 'text--8483',
            },
            'text--9255': {
                parent: {
                    id: 'container--7223',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h1',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Block Variables',
                },
                listeners: {},
                id: 'text--9255',
            },
            'text--7221': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{json}}',
                },
                listeners: {},
                id: 'text--7221',
            },
            'text--890': {
                parent: {
                    id: 'container--7223',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{block.label}}',
                },
                listeners: {},
                id: 'text--890',
            },
            'welcome-text-block': {
                parent: {
                    id: 'container--9623',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{LLM}}',
                },
                listeners: {},
                id: 'welcome-text-block',
            },
            'text--6115': {
                parent: {
                    id: 'container--9623',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h1',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Engine Variables',
                },
                listeners: {},
                id: 'text--6115',
            },
            'text--8976': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h1',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Notebook Variables',
                },
                listeners: {},
                id: 'text--8976',
            },
            'text--3551': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h3',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Cell',
                },
                listeners: {},
                id: 'text--3551',
            },
            'text--2520': {
                parent: {
                    id: 'container--7223',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{block}}',
                },
                listeners: {},
                id: 'text--2520',
            },
            'text--4214': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'p',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textAlign: 'center',
                        textDecoration: '',
                        textOverflow: 'ellipsis',
                    },
                    text: 'This is an app used to help you understand the usage of our variables within our drag and drop app  builder',
                },
                listeners: {},
                id: 'text--4214',
            },
            'input--2178': {
                parent: {
                    id: 'container--7223',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'Name',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: 'MOOSE AI',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--2178',
            },
            'text--7984': {
                parent: {
                    id: 'container--9623',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{Vector}}',
                },
                listeners: {},
                id: 'text--7984',
            },
            'text--9777': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{string}}',
                },
                listeners: {},
                id: 'text--9777',
            },
            'text--1176': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h3',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Query',
                },
                listeners: {},
                id: 'text--1176',
            },
            'text--1771': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {},
                widget: 'text',
                data: {
                    variant: 'h1',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textAlign: 'center',
                        textDecoration: 'underline',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Variables Example',
                },
                listeners: {},
                id: 'text--1771',
            },
            'text--3669': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{number}}',
                },
                listeners: {},
                id: 'text--3669',
            },
            'text--5619': {
                parent: {
                    id: 'container--9623',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{DB}}',
                },
                listeners: {},
                id: 'text--5619',
            },
            'text--4832': {
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{cell}}',
                },
                listeners: {},
                id: 'text--4832',
            },
            'text--4898': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{cell.isLoading}}',
                },
                listeners: {},
                id: 'text--4898',
            },
            'page-1': {
                parent: null,
                slots: {
                    content: {
                        children: [
                            'text--1771',
                            'text--4214',
                            'container--9623',
                            'container--620',
                            'container--7223',
                            'container--1511',
                        ],
                        name: 'content',
                    },
                },
                widget: 'page',
                data: {
                    style: {
                        padding: '24px',
                        fontFamily: 'roboto',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {
                    onPageLoad: [
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'python_code',
                            },
                        },
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'py-code',
                            },
                        },
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'default',
                            },
                        },
                    ],
                },
                id: 'page-1',
            },
            'text--9903': {
                parent: {
                    id: 'container--620',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        overflow: 'auto',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{array}}',
                },
                listeners: {},
                id: 'text--9903',
            },
            'container--9623': {
                id: 'container--9623',
                widget: 'container',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                        gap: '8px',
                        flexWrap: 'wrap',
                        border: '2px solid ',
                        height: '6000px',
                    },
                },
                listeners: {},
                slots: {
                    children: {
                        name: 'children',
                        children: [
                            'text--6115',
                            'text--5619',
                            'text--7984',
                            'welcome-text-block',
                        ],
                    },
                },
            },
            'container--620': {
                id: 'container--620',
                widget: 'container',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                        gap: '8px',
                        flexWrap: 'wrap',
                        border: '2px solid #ff0000',
                        height: '6000px',
                    },
                },
                listeners: {},
                slots: {
                    children: {
                        name: 'children',
                        children: [
                            'text--6141',
                            'text--3669',
                            'text--9777',
                            'text--4898',
                            'text--7221',
                            'text--9903',
                        ],
                    },
                },
            },
            'container--7223': {
                id: 'container--7223',
                widget: 'container',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                        gap: '8px',
                        flexWrap: 'wrap',
                        border: '2px solid #0040ff',
                        height: '6000px',
                    },
                },
                listeners: {},
                slots: {
                    children: {
                        name: 'children',
                        children: [
                            'text--9255',
                            'input--2178',
                            'text--890',
                            'text--2520',
                        ],
                    },
                },
            },
            'container--1511': {
                id: 'container--1511',
                widget: 'container',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                        gap: '8px',
                        flexWrap: 'wrap',
                        border: '2px solid #008009',
                        height: '6000px',
                    },
                },
                listeners: {},
                slots: {
                    children: {
                        name: 'children',
                        children: [
                            'text--8976',
                            'text--1176',
                            'text--8076',
                            'text--3551',
                            'text--4832',
                            'text--7385',
                            'text--8483',
                        ],
                    },
                },
            },
            'text--7385': {
                id: 'text--7385',
                widget: 'text',
                parent: {
                    id: 'container--1511',
                    slot: 'children',
                },
                data: {
                    variant: 'h3',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Query State',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            date: {
                type: 'date',
                isInput: true,
                isOutput: false,
                value: '2024-12-31',
            },
            string: {
                type: 'string',
                isInput: true,
                isOutput: false,
                value: 'This is a string variable',
            },
            query: {
                to: 'python_code',
                type: 'query',
                isInput: false,
                isOutput: true,
            },
            new_var: {
                type: 'model',
                isInput: true,
                isOutput: false,
                value: 'e338934d-bef1-4920-9136-dc0e37060dfa',
            },
            cell: {
                to: 'python_code',
                type: 'cell',
                cellId: '21756',
                isInput: false,
                isOutput: true,
            },
            LLM: {
                type: 'model',
                isInput: true,
                isOutput: false,
                value: '001510f8-b86e-492e-a7f0-41299775e7d9',
            },
            number: {
                type: 'number',
                isInput: true,
                isOutput: false,
                value: 10,
            },
            array: {
                type: 'array',
                isInput: true,
                isOutput: false,
                value: [1, 2, 3],
            },
            json: {
                type: 'JSON',
                isInput: true,
                isOutput: false,
                value: {
                    a: 'this is a label for a',
                },
            },
            block: {
                to: 'input--2178',
                type: 'block',
                isInput: true,
                isOutput: false,
            },
            Vector: {
                type: 'vector',
                isInput: true,
                isOutput: false,
                value: 'aa72a4be-cb7a-4f7e-b384-7be5c3c081f5',
            },
            DB: {
                type: 'database',
                isInput: true,
                isOutput: false,
                value: '61b2d7c0-5dd4-4ea9-bc6e-9f39f2ae8d7a',
            },
            py_code: {
                to: 'py-code',
                type: 'query',
                isInput: false,
                isOutput: true,
            },
        },
        executionOrder: ['default', 'python_code', 'py-code'],
        version: '1.0.0-alpha.3',
    },
};
