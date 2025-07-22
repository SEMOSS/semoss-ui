import { Block } from '@semoss/renderer';

export const BASE_PAGE_BLOCKS: Record<string, Block> = {
    'page-1': {
        id: 'page-1',
        widget: 'page',
        parent: null,
        data: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                gap: '8px',
                fontFamily: 'roboto',
            },
            route: '',
        },
        listeners: {
            onPageLoad: {
                type: 'sync',
                order: [],
            },
        },
        slots: {
            content: {
                name: 'content',
                children: ['container--1'],
            },
        },
    },
    'container--1': {
        id: 'container--1',
        widget: 'container',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'wrap',
                padding: '4px',
                gap: '8px',
                overflow: 'hidden',
            },
        },
        listeners: {
            preProcess: {
                type: 'sync',
                order: [],
            },
        },
        slots: {
            children: {
                name: 'children',
                children: ['text--1'],
            },
        },
    },
    'text--1': {
        id: 'text--1',
        widget: 'text',
        parent: {
            id: 'container--1',
            slot: 'children',
        },
        data: {
            style: {
                padding: '4px',
                whiteSpace: 'pre-line',
                textOverflow: 'ellipsis',
                overflow: 'auto',
            },
            text: 'Welcome to the UI Builder! Drag and drop blocks to use in your app.',
        },
        listeners: {
            preProcess: {
                type: 'sync',
                order: [],
            },
        },
        slots: {},
    },
};
