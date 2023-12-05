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

export const DESCRIPTION_CONTAINER = 'description-container';
export const PROMPT_CONTAINER_BLOCK_ID = 'prompt-container';
export const APP_TITLE_BLOCK_ID = 'title';
export const HELP_TEXT_BLOCK_ID = 'help-text';
export const PROMPT_SUBMIT_BLOCK_ID = 'prompt-submit';
export const PROMPT_RESPONSE_BLOCK_ID = 'prompt-response';
export const PROMPT_QUERY_ID = 'prompt-query';

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

    const prompt = tokenStrings.join(' ');

    // todo only import once
    let query = `from gaas_gpt_model import ModelEngine; \
        from gaas_gpt_vector import VectorEngine; \
        model = ModelEngine(engine_id = "${model}", insight_id = '\${i}'); \
        ${
            vector
                ? `vector = VectorEngine(engine_id = "${vector}", insight_id = '\${i}', insight_folder = '\${if}');`
                : ''
        } \
        ${
            vector
                ? `matches = vector.nearestNeighbor(search_statement = "${prompt}", limit = 5);`
                : ''
        } \
        prompt = "${prompt}"${
        vector
            ? ` + "Ask based on " + ' '.join([matchItem for matchItem in matches])`
            : ''
    }; \
        response = model.ask(question = prompt)`;

    console.log(query);

    return {
        [PROMPT_QUERY_ID]: {
            id: PROMPT_QUERY_ID,
            mode: 'manual',
            steps: [
                {
                    id: 'pixel-1',
                    operation: [],
                    output: undefined,
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
                        children: [
                            DESCRIPTION_CONTAINER,
                            PROMPT_CONTAINER_BLOCK_ID,
                        ],
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
        },
    };

    // updat the title
    state.blocks[APP_TITLE_BLOCK_ID].data.text = builder.title.value;

    // inputs
    let childInputIds = [];
    for (const [tokenIndex, inputType] of Object.entries(
        builder.inputTypes.value as object,
    )) {
        const token = builder.inputs.value[tokenIndex] as Token;
        const inputBlock = getBlockForInput(token, inputType);
        if (inputBlock) {
            childInputIds = [...childInputIds, inputBlock.id];
            state.blocks = { ...state.blocks, [inputBlock.id]: inputBlock };
        }
    }

    // submit
    state.blocks[PROMPT_CONTAINER_BLOCK_ID].slots.children.children = [
        ...childInputIds,
        ...state.blocks[PROMPT_CONTAINER_BLOCK_ID].slots.children.children,
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
