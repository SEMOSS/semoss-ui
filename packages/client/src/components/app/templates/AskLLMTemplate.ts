import { ActionMessages } from '@semoss/renderer';

import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';

export const AskLLMTemplate: Template = {
    name: 'Ask LLM',
    description: 'Ask an LLM a question',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: ['LLM'],
    state: {
        queries: {
            'ask-llm': {
                id: 'ask-llm',
                cells: [
                    {
                        id: 'cell-1',
                        widget: 'code',
                        parameters: {
                            code: 'LLM(engine=["{{model}}"], command=["{{question}}"]);',
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
                listeners: {},
                id: 'container',
            },
            form: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    children: {
                        children: ['question', 'submit'],
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
                listeners: {},
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
                    value: '',
                },
                listeners: {
                    onClick: {
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
                    loading: '{{ask-llm.isLoading}}',
                },
                listeners: {
                    onClick: {
                        type: 'sync',
                        order: [
                            {
                                payload: {
                                    queryId: 'ask-llm',
                                },
                                message: ActionMessages.RUN_QUERY,
                            },
                        ],
                    },
                },
                id: 'submit',
            },
            'page-1': {
                parent: null,
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
                    text: '{{ask-llm.output.response}}',
                },
                listeners: {},
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
                    text: 'Ask an LLM a question',
                },
                listeners: {},
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
                    text: 'Ask LLM',
                },
                listeners: {},
                id: 'title',
            },
        },
        variables: {
            question: {
                to: 'question',
                type: 'block',
                isInput: true,
                isOutput: false,
            },
            'ask-llm': {
                to: 'ask-llm',
                type: 'query',
                isInput: false,
                isOutput: true,
            },
            model: {
                type: 'model',
                value: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                isInput: true,
                isOutput: false,
            },
        },
        executionOrder: ['ask-llm'],
        version: '1.0.0-alpha.4',
    },
};
