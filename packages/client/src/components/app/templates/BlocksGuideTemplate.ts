import LANDINGPAGE from '@/assets/img/query.jpeg';

import { Template } from './templates.types';

export const BlocksGuideTemplate: Template = {
    name: 'Variables Guide',
    description:
        'This is an app used to help you understand the usage of our variables within our drag and drop app  builder',
    image: LANDINGPAGE,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        version: '1.0.0-alpha.1',
        executionOrder: [],
        notebooks: {},
        variables: {
            Vector: {
                to: 'vector--3773',
                type: 'vector',
            },
            DB: {
                to: 'database--820',
                type: 'database',
            },
            block: {
                to: 'input--2178',
                type: 'block',
            },
            query: {
                to: 'python_code',
                type: 'query',
            },
            cell: {
                to: 'python_code',
                type: 'cell',
                cellId: '21756',
            },
            py_code: {
                to: 'py-code',
                type: 'query',
            },
            new_var: {
                to: 'model--8923',
                type: 'model',
            },
            string: {
                to: 'string--75',
                type: 'string',
            },
            date: {
                to: 'date--5417',
                type: 'date',
            },
            LLM: {
                to: 'model--1476',
                type: 'model',
            },
            json: {
                to: 'JSON--7633',
                type: 'JSON',
            },
            array: {
                to: 'array--4834',
                type: 'array',
            },
            number: {
                to: 'number--7715',
                type: 'number',
            },
        },
        dependencies: {
            'vector--3773': 'aa72a4be-cb7a-4f7e-b384-7be5c3c081f5',
            'database--820': '61b2d7c0-5dd4-4ea9-bc6e-9f39f2ae8d7a',
            'string--75': 'This is a string variable',
            'model--8923': 'e338934d-bef1-4920-9136-dc0e37060dfa',
            'date--5417': '2024-12-31',
            'model--1476': '001510f8-b86e-492e-a7f0-41299775e7d9',
            'JSON--7633': {
                a: 'this is a label for a',
            },
            'array--4834': [1, 2, 3],
            'number--7715': 10,
        },
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
                            type: 'py',
                            code: '',
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
                            type: 'py',
                            code: '"Output of Query"',
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
            'welcome-container-block': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {
                    children: {
                        children: [
                            'welcome-text-block',
                            'text--5619',
                            'text--7984',
                            'text--6141',
                            'text--9777',
                            'text--3669',
                            'text--7221',
                            'text--9903',
                            'text--8976',
                            'text--1176',
                            'text--8076',
                            'text--8483',
                            'text--3551',
                        ],
                        name: 'children',
                    },
                },
                widget: 'container',
                data: {
                    style: {
                        padding: '4px',
                        overflow: 'hidden',
                        flexWrap: 'wrap',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {},
                id: 'welcome-container-block',
            },
            'page-1': {
                parent: null,
                slots: {
                    content: {
                        children: [
                            'text--1771',
                            'text--4214',
                            'text--6115',
                            'welcome-container-block',
                            'text--4832',
                            'text--4898',
                            'text--9255',
                            'text--2520',
                            'text--890',
                            'input--2178',
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
                    onPageLoad: [],
                },
                id: 'page-1',
            },
            'welcome-text-block': {
                parent: {
                    id: 'welcome-container-block',
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
            'input--2178': {
                id: 'input--2178',
                widget: 'input',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: 'MOOSE AI',
                    label: 'Name',
                    hint: '',
                    type: 'text',
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
                        name: 'content',
                        children: [],
                    },
                },
            },
            'text--6115': {
                id: 'text--6115',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Engine Variables',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'text--5619': {
                id: 'text--5619',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--7984': {
                id: 'text--7984',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--6141': {
                id: 'text--6141',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Data Structure Variables',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'text--9777': {
                id: 'text--9777',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--9903': {
                id: 'text--9903',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--8976': {
                id: 'text--8976',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Notebook Variables',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'text--1176': {
                id: 'text--1176',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Query',
                    variant: 'h3',
                },
                listeners: {},
                slots: {},
            },
            'text--3551': {
                id: 'text--3551',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Cell',
                    variant: 'h3',
                },
                listeners: {},
                slots: {},
            },
            'text--9255': {
                id: 'text--9255',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Block Variables',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'text--2520': {
                id: 'text--2520',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
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
                slots: {},
            },
            'text--890': {
                id: 'text--890',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
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
                slots: {},
            },
            'text--8076': {
                id: 'text--8076',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--8483': {
                id: 'text--8483',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--4832': {
                id: 'text--4832',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
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
                slots: {},
            },
            'text--4898': {
                id: 'text--4898',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
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
                slots: {},
            },
            'text--1771': {
                id: 'text--1771',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        textDecoration: 'underline',
                    },
                    text: 'Variables Example',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'text--4214': {
                id: 'text--4214',
                widget: 'text',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        textDecoration: '',
                    },
                    text: 'This is an app used to help you understand the usage of our variables within our drag and drop app  builder',
                    variant: 'p',
                },
                listeners: {},
                slots: {},
            },
            'text--7221': {
                id: 'text--7221',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
            'text--3669': {
                id: 'text--3669',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
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
                slots: {},
            },
        },
    },
};
