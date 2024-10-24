import { ActionMessages } from '@/stores';
import {
    ButtonBlockConfig,
    ContainerBlockConfig,
    InputBlockConfig,
    PageBlockConfig,
    TextBlockConfig,
} from '@/components/block-defaults';
import CHATAI from '@/assets/img/query.jpeg';

import { Template } from './templates.types';

export const AskLLMTemplate: Template = {
    name: 'Ask LLM',
    description: 'Ask an LLM a question',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: ['LLM'],
    state: {
        version: '1.0.0-alpha.1',
        executionOrder: [],
        notebooks: {},
        variables: {
            question: {
                to: 'question',
                type: 'block',
            },
            'ask-llm': {
                to: 'ask-llm',
                type: 'query',
            },
            model: {
                to: 'model',
                type: 'model',
            },
        },
        dependencies: {
            model: '17753d59-4536-4415-a6ac-f673b1a90a87',
        },
        queries: {
            ['ask-llm']: {
                id: 'ask-llm',
                cells: [
                    {
                        id: 'cell-1',
                        widget: 'code',
                        parameters: {
                            type: 'pixel',
                            // Do we want to replace hardcoded LLM to a user default
                            code: `LLM(engine=["{{model}}"], command=["{{question}}"]);`,
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
                listeners: {
                    onPageLoad: [],
                },
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
                        children: ['title', 'description', 'form', 'response'],
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
                        ...TextBlockConfig.data.style,
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
                    style: ContainerBlockConfig.data.style,
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
                    loading: '{{ask-llm.isLoading}}',
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
                    style: TextBlockConfig.data.style,
                    text: '{{ask-llm.output.response}}',
                },
                listeners: {},
                slots: {},
            },
        },
    },
};
