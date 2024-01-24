export const BASE_PAGE_BLOCKS = {
    'page-1': {
        id: 'page-1',
        widget: 'page',
        parent: null,
        data: {
            style: {
                fontFamily: 'roboto',
            },
        },
        listeners: {},
        slots: {
            content: {
                name: 'content',
                children: ['welcome-container-block'],
            },
        },
    },
    'welcome-container-block': {
        id: 'welcome-container-block',
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
            },
        },
        listeners: {},
        slots: {
            children: {
                name: 'children',
                children: ['welcome-text-block'],
            },
        },
    },
    'welcome-text-block': {
        id: 'welcome-text-block',
        widget: 'text',
        parent: {
            id: 'welcome-container-block',
            slot: 'children',
        },
        data: {
            style: {
                textAlign: 'center',
            },
            text: 'Welcome to the UI Builder! Drag and drop blocks to use in your app.',
        },
        listeners: {},
        slots: {},
    },
};
