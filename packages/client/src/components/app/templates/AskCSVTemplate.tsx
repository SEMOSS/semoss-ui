import { ActionMessages } from '@/stores';
import {
    ButtonBlockConfig,
    ContainerBlockConfig,
    UploadBlockConfig,
    InputBlockConfig,
    PageBlockConfig,
    TextBlockConfig,
} from '@/components/block-defaults';
import QUERY from '@/assets/img/query.jpeg';

import { Template } from './templates.types';

export const AskCSVTemplate: Template = {
    name: 'Ask CSV',
    description: 'Query a CSV, generate SQL, and see results',
    image: QUERY,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: ['NLP', 'SQL', 'LLM'],
    state: {
        version: '1.0.0-alpha.1',
        variables: {
            file: {
                to: 'file',
                type: 'block',
            },
            question: {
                to: 'question',
                type: 'block',
            },
            'ask-model': {
                to: 'ask-model',
                type: 'query',
            },
            model: {
                to: 'model',
                type: 'model',
            },
        },
        variants: {},
        dependencies: {
            model: '17753d59-4536-4415-a6ac-f673b1a90a87',
        },
        queries: {
            ['ask-model']: {
                id: 'ask-model',
                cells: [
                    {
                        id: 'file-read',
                        widget: 'code',
                        parameters: {
                            type: 'pixel',
                            code: `FileRead ( filePath = ["{{file}}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );`,
                        },
                    },
                    {
                        id: 'py-query-function',
                        widget: 'code',
                        parameters: {
                            type: 'pixel',
                            code: `NLPQuery2(engine=["{{model}}"], command=["{{question}}"]);`,
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
                    loading: '{{ask-model.isLoading}}',
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
                    text: '{{ask-model.output.output.Query}}',
                },
                listeners: {},
                slots: {},
            },
        },
    },
};
