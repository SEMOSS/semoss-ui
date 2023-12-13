import { Builder, Token } from './prompt.types';
import {
    INPUT_TYPE_DATE,
    INPUT_TYPE_NUMBER,
    INPUT_TYPE_TEXT,
    INPUT_TYPE_SELECT,
    TOKEN_TYPE_TEXT,
} from './prompt.constants';
import {
    ActionMessages,
    Block,
    MonolithStore,
    QueryStateConfig,
    SerializedState,
} from '@/stores';
import { AppMetadata } from '../app';

export const APP_PAGE_BLOCK_ID = 'page-1';
export const PAGE_HEADER_BLOCK_ID = 'page-header';
export const DESCRIPTION_BLOCK_ID = 'description';
export const PAGE_BODY_BLOCK_ID = 'page-body';
export const PROMPT_BLOCK_ID = 'prompt';
export const PAGE_FOOTER_BLOCK_ID = 'page-footer';
export const APP_TITLE_BLOCK_ID = 'title';
export const HELP_TEXT_BLOCK_ID = 'help-text';
export const PROMPT_SUBMIT_BLOCK_ID = 'prompt-submit';
export const PROMPT_RESPONSE_BLOCK_ID = 'prompt-response';
export const PROMPT_QUERY_ID = 'prompt-query';
export const PROMPT_FUNCTION_QUERY_ID = 'prompt-query-function';

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
            id: PROMPT_BLOCK_ID,
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
            id: PROMPT_BLOCK_ID,
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
            alert('Block not implemented for this input type yet.');
            return null;
    }
}

export function getQueryForPrompt(
    model: string,
    vector: string | undefined,
    tokens: Token[],
    inputTypes: object,
): Record<string, QueryStateConfig> {
    const tokenStrings: string[] = [];
    // compose tokens into a command
    tokens.forEach((token: Token) => {
        if (token.type === TOKEN_TYPE_TEXT) {
            tokenStrings.push(token.display);
        } else if (!token.isHiddenPhraseInputToken) {
            // do this to preserve punctuation attached to the token from the prompt
            const inputTokenParts = token.display.split(
                new RegExp(`(${token.key})`),
            );
            const keyIndex = inputTokenParts.indexOf(token.key);
            inputTokenParts[keyIndex] = `{{${getIdForInput(
                token.linkedInputToken !== undefined
                    ? inputTypes[token.linkedInputToken]
                    : inputTypes[token.index],
                token.linkedInputToken ?? token.index,
            )}.value}}`;
            tokenStrings.push(inputTokenParts.join(''));
        }
    });

    let prompt = tokenStrings.join(' ');
    // check if prompt ends with a period
    // if not add it so it doesn't disrupt the "Ask based on" attachment in the function
    if (
        prompt[prompt.length - 1] !== '.' &&
        prompt[prompt.length - 1] !== '!' &&
        prompt[prompt.length - 1] !== '?'
    ) {
        prompt = prompt + '.';
    }

    const functionQuery =
        `def jointVectorModelQuery(search_statement:str, limit = 5) -> str:` +
        `import json;` +
        `from gaas_gpt_model import ModelEngine;` +
        `from gaas_gpt_vector import VectorEngine;` +
        `model = ModelEngine(engine_id = "${model}", insight_id = '\${i}');` +
        `${
            vector
                ? `vector = VectorEngine(engine_id = "${vector}", insight_id = '\${i}', insight_folder = '\${if}');`
                : ''
        }` +
        `${
            vector
                ? `matches = vector.nearestNeighbor(search_statement = search_statement, limit = limit);`
                : ''
        }` +
        `prompt = search_statement ${
            vector
                ? `+ " Ask based on" + ' '.join([matchItem['Content'] for matchItem in matches])`
                : ''
        };` +
        `response = model.ask(question = prompt);` +
        `return json.dumps(response[0]['response']);`;

    const query = `jointVectorModelQuery("${prompt}")`;

    return {
        [PROMPT_FUNCTION_QUERY_ID]: {
            id: PROMPT_FUNCTION_QUERY_ID,
            mode: 'automatic',
            steps: [
                {
                    id: 'py-query-function',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: functionQuery,
                    },
                },
            ],
        },
        [PROMPT_QUERY_ID]: {
            id: PROMPT_QUERY_ID,
            mode: 'manual',
            steps: [
                {
                    id: 'py-query',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: query,
                    },
                },
            ],
        },
    };
}

export async function setBlocksAndOpenUIBuilder(
    builder: Builder,
    monolithStore: MonolithStore,
    navigate: (route: string) => void,
) {
    // create the state
    const state: SerializedState = {
        queries: {},
        blocks: {
            [APP_PAGE_BLOCK_ID]: {
                id: APP_PAGE_BLOCK_ID,
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
                        children: [
                            PAGE_HEADER_BLOCK_ID,
                            PAGE_BODY_BLOCK_ID,
                            PAGE_FOOTER_BLOCK_ID,
                        ],
                    },
                },
            },
            [PAGE_HEADER_BLOCK_ID]: {
                id: PAGE_HEADER_BLOCK_ID,
                widget: 'header',
                parent: {
                    id: APP_PAGE_BLOCK_ID,
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '1rem',
                    },
                },
                listeners: {},
                slots: {
                    content: {
                        name: 'content',
                        children: [DESCRIPTION_BLOCK_ID],
                    },
                },
            },
            [DESCRIPTION_BLOCK_ID]: {
                id: DESCRIPTION_BLOCK_ID,
                widget: 'container',
                parent: {
                    id: PAGE_HEADER_BLOCK_ID,
                    slot: 'content',
                },
                data: {
                    style: {
                        background: 'white',
                        flexDirection: 'column',
                        gap: '2rem',
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
                    id: DESCRIPTION_BLOCK_ID,
                    slot: 'children',
                },
                data: {
                    style: {
                        fontSize: '2.125rem',
                        fontWeight: 'bold',
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
                    id: DESCRIPTION_BLOCK_ID,
                    slot: 'children',
                },
                data: {
                    style: {
                        textAlign: 'center',
                        fontSize: '1rem',
                    },
                    text: 'Welcome to the UI Builder! Below are pre-configured blocks for your prompt inputs to use in your app.',
                },
                listeners: {},
                slots: {},
            },
            [PAGE_BODY_BLOCK_ID]: {
                id: PAGE_BODY_BLOCK_ID,
                widget: 'body',
                parent: {
                    id: APP_PAGE_BLOCK_ID,
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '1rem',
                    },
                },
                listeners: {},
                slots: {
                    content: {
                        name: 'content',
                        children: [PROMPT_BLOCK_ID],
                    },
                },
            },
            [PROMPT_BLOCK_ID]: {
                id: PROMPT_BLOCK_ID,
                widget: 'container',
                parent: {
                    id: PAGE_BODY_BLOCK_ID,
                    slot: 'content',
                },
                data: {
                    style: {
                        background: 'white',
                        flexDirection: 'column',
                        gap: '2rem',
                        width: '100%',
                        maxWidth: '900px',
                        margin: '0 auto',
                        alignItems: 'center',
                    },
                },
                listeners: {},
                slots: {
                    children: {
                        name: 'children',
                        children: [
                            PROMPT_SUBMIT_BLOCK_ID,
                            PROMPT_RESPONSE_BLOCK_ID,
                        ],
                    },
                },
            },
            [PROMPT_SUBMIT_BLOCK_ID]: {
                id: PROMPT_SUBMIT_BLOCK_ID,
                widget: 'button',
                parent: {
                    id: PROMPT_BLOCK_ID,
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
                                queryId: PROMPT_QUERY_ID,
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
                    id: PROMPT_BLOCK_ID,
                    slot: 'children',
                },
                data: {
                    style: {
                        fontSize: '1rem',
                    },
                    markdown: `{{${PROMPT_QUERY_ID}.data.0.output}}`,
                },
                listeners: {},
                slots: {},
            },
        },
    };

    // updat the title
    state.blocks[APP_TITLE_BLOCK_ID].data.text = builder.title.value;

    // inputs
    let childInputIds = [];
    for (const [tokenIndex, inputType] of Object.entries(
        (builder.inputTypes.value as object) ?? {},
    )) {
        const token = builder.inputs.value[tokenIndex] as Token;
        const inputBlock = getBlockForInput(token, inputType);
        if (inputBlock) {
            childInputIds = [...childInputIds, inputBlock.id];
            state.blocks = { ...state.blocks, [inputBlock.id]: inputBlock };
        }
    }

    // submit
    state.blocks[PROMPT_BLOCK_ID].slots.children.children = [
        ...childInputIds,
        ...state.blocks[PROMPT_BLOCK_ID].slots.children.children,
    ];

    state.queries = getQueryForPrompt(
        builder.model.value as string,
        builder.vector.value as string | undefined,
        builder.inputs.value as Token[],
        builder.inputTypes.value as object,
    );

    const pixel = `CreateAppFromBlocks ( project = [ "${
        builder.title.value
    }" ] , json =[${JSON.stringify(state)}]  ) ;`;

    // create the app
    const { pixelReturn } = await monolithStore.runQuery<[AppMetadata]>(pixel);

    const app = pixelReturn[0].output;

    // navigate to the app
    navigate(`../${app.project_id}`);
}
