export const BASE_PAGE_BLOCKS = {
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
        },
        listeners: {
            onPageLoad: [],
        },
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
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'wrap',
                padding: '4px',
                gap: '8px',
                overflow: 'hidden',
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
                padding: '4px',
                whiteSpace: 'pre-line',
                textOverflow: 'ellipsis',
                overflow: 'auto',
            },
            text: 'Welcome to the UI Builder! Drag and drop blocks to use in your app.',
        },
        listeners: {},
        slots: {},
    },
};
