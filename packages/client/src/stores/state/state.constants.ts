import { ActionMessages } from './state.actions';
import { Template } from './state.types';

import SEMOSS from '@/assets/img/SEMOSS_BLUE_LOGO.svg';

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};

export const DEFAULT_TEMPLATE: Template[] = [
    {
        name: 'Hello World',
        description: 'A simple starter app',
        image: SEMOSS,
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
                    data: {},
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
                        style: {
                            background: 'white',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: '16px',
                            padding: '32px',
                            width: '100%',
                            maxWidth: '900px',
                            margin: '0 auto',
                        },
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
                        text: 'Hello World',
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
        image: SEMOSS,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: ['NLP', 'SQL', 'LLM'],
        state: {
            queries: {
                ['ask-model']: {
                    id: 'ask-model',
                    mode: 'manual',
                    steps: [
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
                                code: `NLPQuery2(engine=["4801422a-5c62-421e-a00c-05c6a9e15de8"], command=["{{block.question.value}}"])`,
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
                        style: {
                            fontFamily: 'roboto',
                            background: 'rgba(250, 250, 250, 1)',
                            padding: '16px',
                            overflow: 'auto',
                        },
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
                        style: {
                            background: 'white',
                            flexDirection: 'column',
                            gap: '16px',
                            padding: '32px',
                            width: '100%',
                            maxWidth: '900px',
                            margin: '0 auto',
                            boxShadow:
                                'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                        },
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
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            width: '100%',
                        },
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
                        label: 'Upload',
                        type: 'file',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['question']: {
                    id: 'question',
                    widget: 'text-field',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
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
                        style: {
                            width: '100%',
                        },
                        label: 'Ask',
                        loading: '{{query.ask-model.isLoading}}',
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
                        text: '{{query.ask-model.output.Query}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
];
