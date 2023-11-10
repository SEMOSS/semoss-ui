import { Token } from './prompt.types';
import {
    INPUT_TYPE_DATE,
    INPUT_TYPE_NUMBER,
    INPUT_TYPE_TEXT,
    INPUT_TYPE_SELECT,
    TOKEN_TYPE_TEXT,
} from './prompt.constants';
import { ActionMessages, Block, Query } from '@/stores';

export const DESCRIPTION_CONTAINER: string = 'description-container';
export const PROMPT_CONTAINER_BLOCK_ID: string = 'prompt-container';
export const APP_TITLE_BLOCK_ID: string = 'title';
export const HELP_TEXT_BLOCK_ID: string = 'help-text';
export const PROMPT_SUBMIT_BLOCK_ID: string = 'prompt-submit';
export const PROMPT_RESPONSE_BLOCK_ID: string = 'prompt-response';
export const PROMPT_QUERY_ID: string = 'prompt-query';
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
                children: [APP_TITLE_BLOCK_ID, HELP_TEXT_BLOCK_ID],
            },
        },
    },
    [APP_TITLE_BLOCK_ID]: {
        id: APP_TITLE_BLOCK_ID,
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
    [HELP_TEXT_BLOCK_ID]: {
        id: HELP_TEXT_BLOCK_ID,
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
                children: [PROMPT_SUBMIT_BLOCK_ID, PROMPT_RESPONSE_BLOCK_ID],
            },
        },
    },
    [PROMPT_SUBMIT_BLOCK_ID]: {
        id: PROMPT_SUBMIT_BLOCK_ID,
        widget: 'button',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            style: {
                color: 'white',
                backgroundColor: 'blue',
                width: '125px',
            },
            label: 'Submit',
        },
        listeners: {
            onClick: [
                {
                    message: ActionMessages.RUN_QUERY,
                    payload: {
                        id: PROMPT_QUERY_ID,
                    },
                },
            ],
        },
        slots: {},
    },
    [PROMPT_RESPONSE_BLOCK_ID]: {
        id: PROMPT_RESPONSE_BLOCK_ID,
        widget: 'markdown',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            style: {},
            markdown: `{{${PROMPT_QUERY_ID}.data.response}}`,
        },
        listeners: {},
        slots: {},
    },
};

function capitalizeLabel(label: string): string {
    const words = label.split(' ');
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substring(1);
    }
    return words.join(' ');
}

function getIdForInput(inputType: string, index: number) {
    return `${inputType}-input-${index}`;
}

function getTextFieldInputBlock(
    inputType: string,
    index: number,
    label: string,
) {
    return {
        id: getIdForInput(inputType, index),
        widget: 'text-field',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            label: label,
            value: '',
            type: inputType,
            style: {},
        },
        listeners: {},
        slots: {},
    };
}

function getSelectInputBlock(inputType: string, index: number, label: string) {
    return {
        id: getIdForInput(inputType, index),
        widget: 'select',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            label: label,
            value: '',
            options: [],
            style: {},
        },
        listeners: {},
        slots: {},
    };
}

export function getBlockForInput(
    token: Token,
    inputType: string,
): Block | null {
    switch (inputType) {
        case INPUT_TYPE_DATE:
        case INPUT_TYPE_NUMBER:
        case INPUT_TYPE_TEXT:
            return getTextFieldInputBlock(
                inputType,
                token.index,
                capitalizeLabel(token.key),
            );
        case INPUT_TYPE_SELECT:
            return getSelectInputBlock(
                inputType,
                token.index,
                capitalizeLabel(token.key),
            );
        default:
            console.log('Block not implemented for this input type yet.');
            return null;
    }
}

export function getQueryForPrompt(
    model: string,
    tokens: Token[],
    inputTypes: object,
): Record<string, Query> {
    let tokenStrings: string[] = [];
    // compose tokens into a command
    tokens.forEach((token: Token) => {
        if (token.type === TOKEN_TYPE_TEXT) {
            tokenStrings.push(token.display);
        } else if (!token.isHiddenPhraseInputToken) {
            // do this to preserve punctuation attached to the token from the prompt
            const inputTokenParts = token.display.split(
                new RegExp(`(${token.key})`),
            );
            let keyIndex = inputTokenParts.indexOf(token.key);
            inputTokenParts[keyIndex] = `{{${getIdForInput(
                inputTypes[token.index],
                token.index,
            )}.value}}`;
            tokenStrings.push(inputTokenParts.join(''));
        }
    });
    return {
        [PROMPT_QUERY_ID]: {
            id: PROMPT_QUERY_ID,
            isInitialized: false,
            isLoading: false,
            error: null,
            query: `LLM(engine=["${model}"], command=["<encode>${tokenStrings.join(
                ' ',
            )} Generate the response as markdown.</encode>"]);`,
            data: {
                response: 'Fill out the inputs to generate a response.',
            },
            mode: 'manual',
        },
    };
}
