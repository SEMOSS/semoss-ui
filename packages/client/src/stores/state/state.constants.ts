import { ActionMessages } from './state.actions';
import { SerializedState } from './state.types';

export const HelloWorldApp: SerializedState = {
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
};

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};
