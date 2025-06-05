import {
    ActionMessages,
    ButtonBlockConfig,
    ContainerBlockConfig,
    UploadBlockConfig,
    InputBlockConfig,
    PageBlockConfig,
    TextBlockConfig,
} from '@semoss/renderer';

import { Template } from './templates.types';
import QUERY from '@/assets/img/query.jpeg';

export const AskCSVTemplate: Template = {
    name: 'Ask CSV',
    description: 'Query a CSV, generate SQL, and see results',
    image: QUERY,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: ['NLP', 'SQL', 'LLM'],
    state: {
        queries: {
            'ask-model': {
                id: 'ask-model',
                cells: [
                    {
                        id: 'file-read',
                        widget: 'code',
                        parameters: {
                            code: 'FileRead ( filePath = ["{{file}}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );',
                            type: 'pixel',
                        },
                    },
                    {
                        id: 'py-query-function',
                        widget: 'code',
                        parameters: {
                            code: 'NLPQuery2(engine=["{{model}}"], command=["{{question}}"]);',
                            type: 'pixel',
                        },
                    },
                ],
            },
        },
        blocks: {
            container: {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {
                    children: {
                        children: ['title', 'description', 'form', 'response'],
                        name: 'children',
                    },
                },
                widget: 'container',
                data: {
                    style: {
                        padding: '4px',
                        flexWrap: 'wrap',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'container',
            },
            file: {
                parent: {
                    id: 'form',
                    slot: 'children',
                },
                slots: {},
                widget: 'upload',
                data: {
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    label: 'Upload',
                    required: true,
                    value: '\\diabetes.csv',
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                    onChange: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'file',
            },
            form: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    children: {
                        children: ['file', 'question', 'submit'],
                        name: 'children',
                    },
                },
                widget: 'container',
                data: {
                    style: {
                        padding: '4px',
                        flexWrap: 'wrap',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'form',
            },
            question: {
                parent: {
                    id: 'form',
                    slot: 'children',
                },
                slots: {},
                widget: 'input',
                data: {
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    label: 'Question',
                    rows: 3,
                    type: 'text',
                    required: true,
                    value: 'Generate a list of people over the age of 50',
                },
                listeners: {
                    onClick: {
                        type: 'sync',
                        order: [],
                    },
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'question',
            },
            submit: {
                parent: {
                    id: 'form',
                    slot: 'children',
                },
                slots: {},
                widget: 'button',
                data: {
                    variant: 'contained',
                    style: {},
                    label: 'Ask',
                    loading: '{{ask-model.isLoading}}',
                },
                listeners: {
                    onClick: {
                        type: 'sync',
                        order: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'ask-model',
                                },
                            },
                        ],
                    },
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'submit',
            },
            'page-1': {
                slots: {
                    content: {
                        children: ['container'],
                        name: 'content',
                    },
                },
                widget: 'page',
                data: {
                    route: '',
                    style: {
                        padding: '24px',
                        fontFamily: 'roboto',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {
                    onPageLoad: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'page-1',
            },
            response: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: '{{ask-model.2.output.output.Query}}',
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'response',
            },
            description: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '1.25rem',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Upload a csv file and ask a question',
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'description',
            },
            title: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '1.5rem',
                        textOverflow: 'ellipsis',
                    },
                    text: 'CSV Query',
                },
                listeners: {
                    preProcess: {
                        type: 'sync',
                        order: [],
                    },
                },
                id: 'title',
            },
        },
        variables: {
            file: {
                isInput: true,
                isOutput: false,
                to: 'file',
                type: 'block',
            },
            question: {
                isInput: true,
                isOutput: false,
                to: 'question',
                type: 'block',
            },
            model: {
                type: 'model',
                value: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                isInput: true,
                isOutput: false,
            },
            'ask-model': {
                isInput: false,
                isOutput: true,
                to: 'ask-model',
                type: 'query',
            },
        },
        executionOrder: ['ask-model'],
        version: '1.0.0-alpha.8',
    },
};
