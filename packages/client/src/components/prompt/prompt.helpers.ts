import { Token } from './prompt.types';
import { INPUT_TYPE_TEXT } from './prompt.constants';
import { Block } from '@/stores';

export const DESCRIPTION_CONTAINER: string = 'description-container';
export const PROMPT_CONTAINER_BLOCK_ID: string = 'prompt-container';
export const PROMPT_BASE_BLOCKS: Record<string, Block> = {
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
                children: [DESCRIPTION_CONTAINER, PROMPT_CONTAINER_BLOCK_ID],
            },
        },
    },
    [DESCRIPTION_CONTAINER]: {
        id: DESCRIPTION_CONTAINER,
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
                children: ['title', 'help-text'],
            },
        },
    },
    title: {
        id: 'title',
        widget: 'text',
        parent: {
            id: DESCRIPTION_CONTAINER,
            slot: 'children',
        },
        data: {
            style: {
                fontSize: '2.5rem',
                textAlign: 'center',
            },
            text: 'My App',
        },
        listeners: {},
        slots: {},
    },
    'help-text': {
        id: 'help-text',
        widget: 'text',
        parent: {
            id: DESCRIPTION_CONTAINER,
            slot: 'children',
        },
        data: {
            style: {
                textAlign: 'center',
            },
            text: 'Welcome to the UI Builder! Below are pre-configured blocks for your prompt inputs to use in your app.',
        },
        listeners: {},
        slots: {},
    },
    [PROMPT_CONTAINER_BLOCK_ID]: {
        id: PROMPT_CONTAINER_BLOCK_ID,
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
                children: [],
            },
        },
    },
};

function capitalizeLabel(label: string): string {
    const words = label.split(' ');
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substring(1);
    }
    return words.join(' ');
}
function getTextInputBlock(index: number, label: string) {
    return {
        id: `text-input-${index}`,
        widget: 'text-field',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            label: label,
            value: '',
            type: 'text',
        },
        listeners: {},
        slots: {},
    };
}
function getNumberInputBlock(index: number, label: string) {
    return {
        id: `number-input-${index}`,
        widget: 'text-field',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            label: label,
            value: '',
            type: 'number',
        },
        listeners: {},
        slots: {},
    };
}

const INPUT_BLOCK_MAP = {
    [INPUT_TYPE_TEXT]: getTextInputBlock,
};

export function getBlockForInput(token: Token, inputType: string): Block {
    return INPUT_BLOCK_MAP[inputType](token.index, capitalizeLabel(token.key));
}
