import { ActionMessages } from './state.actions';
import { Template } from './state.types';
import {
    ButtonBlockConfig,
    ContainerBlockConfig,
    InputBlockConfig,
    PageBlockConfig,
    TextBlockConfig,
    UploadBlockConfig,
} from '@/components/block-defaults';

import HELLOWORLD from '@/assets/img/helloworld.jpeg';
import QUERY from '@/assets/img/query.jpeg';
import CHATAI from '@/assets/img/chatai.jpeg';

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};

export const DEFAULT_TEMPLATE: Template[] = [
    {
        name: 'Hello World',
        description: 'A simple starter app',
        image: HELLOWORLD,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: [],
        state: {
            queries: {},
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container-1'],
                        },
                    },
                },
                'container-1': {
                    id: 'container-1',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text-1'],
                        },
                    },
                },
                'text-1': {
                    id: 'text-1',
                    widget: 'text',
                    parent: {
                        id: 'container-1',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockConfig.data.style,
                        text: 'Hello World',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Ask LLM',
        description: 'Ask an LLM a question',
        image: CHATAI,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: ['LLM'],
        state: {
            queries: {
                ['ask-llm']: {
                    id: 'ask-llm',
                    mode: 'manual',
                    cells: [
                        {
                            id: 'cell-1',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `LLM(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"])`,
                            },
                        },
                    ],
                },
            },
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockStyles,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container'],
                        },
                    },
                },
                ['container']: {
                    id: 'container',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockStyles,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'title',
                                'description',
                                'form',
                                'response',
                            ],
                        },
                    },
                },
                ['title']: {
                    id: 'title',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.5rem',
                            ...TextBlockStyles,
                        },
                        text: 'Ask LLM',
                    },
                    listeners: {},
                    slots: {},
                },
                ['description']: {
                    id: 'description',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.25rem',
                            ...TextBlockStyles,
                        },
                        text: 'Ask an LLM a question',
                    },
                    listeners: {},
                    slots: {},
                },
                ['form']: {
                    id: 'form',
                    widget: 'container',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: ContainerBlockStyles,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['question', 'submit'],
                        },
                    },
                },
                ['question']: {
                    id: 'question',
                    widget: 'input',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: InputBlockStyles,
                        label: 'Question',
                        rows: 3,
                        type: 'text',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['submit']: {
                    id: 'submit',
                    widget: 'button',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: ButtonBlockStyles,
                        label: 'Ask',
                        loading: '{{query.ask-llm.isLoading}}',
                        variant: 'contained',
                    },
                    listeners: {
                        onClick: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'ask-llm',
                                },
                            },
                        ],
                    },
                    slots: {},
                },
                ['response']: {
                    id: 'response',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockStyles,
                        text: '{{query.ask-llm.output.response}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Ask CSV',
        description: 'Query a CSV, generate SQL, and see results',
        image: QUERY,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: ['NLP', 'SQL', 'LLM'],
        state: {
            queries: {
                ['ask-model']: {
                    id: 'ask-model',
                    mode: 'manual',
                    cells: [
                        {
                            id: 'file-read',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `FileRead ( filePath = [ "{{block.file.value}}" ], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );`,
                            },
                        },
                        {
                            id: 'py-query-function',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `NLPQuery2(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"])`,
                            },
                        },
                    ],
                },
            },
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container'],
                        },
                    },
                },
                ['container']: {
                    id: 'container',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'title',
                                'description',
                                'form',
                                'response',
                            ],
                        },
                    },
                },
                ['title']: {
                    id: 'title',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.5rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'CSV Query',
                    },
                    listeners: {},
                    slots: {},
                },
                ['description']: {
                    id: 'description',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.25rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'Upload a csv file and ask a question',
                    },
                    listeners: {},
                    slots: {},
                },
                ['form']: {
                    id: 'form',
                    widget: 'container',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['file', 'question', 'submit'],
                        },
                    },
                },
                ['file']: {
                    id: 'file',
                    widget: 'upload',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: UploadBlockConfig.data.style,
                        label: 'Upload',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['question']: {
                    id: 'question',
                    widget: 'input',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: InputBlockConfig.data.style,
                        label: 'Question',
                        rows: 3,
                        type: 'text',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['submit']: {
                    id: 'submit',
                    widget: 'button',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: ButtonBlockConfig.data.style,
                        label: 'Ask',
                        loading: '{{query.ask-model.isLoading}}',
                        variant: 'contained',
                    },
                    listeners: {
                        onClick: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'ask-model',
                                },
                            },
                        ],
                    },
                    slots: {},
                },
                ['response']: {
                    id: 'response',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockConfig.data.style,
                        text: '{{query.ask-model.output.0.output.Query}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
];
