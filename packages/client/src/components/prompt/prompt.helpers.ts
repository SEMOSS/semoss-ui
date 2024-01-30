import { Builder, Token } from './prompt.types';
import {
    INPUT_TYPE_TEXT,
    INPUT_TYPE_SELECT,
    TOKEN_TYPE_TEXT,
    INPUT_TYPE_VECTOR,
    INPUT_TYPE_CUSTOM_QUERY,
    INPUT_TYPE_DATABASE,
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
export const PROMPT_QUERY_ID = 'Prompt Query';
export const PROMPT_QUERY_DEFINITION_ID = 'Query Definitions';

function capitalizeLabel(label: string): string {
    const words = label.split(' ');
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substring(1);
    }
    return words.join(' ');
}

export function getIdForInput(inputType: string, index: number) {
    return `${inputType}-input-${index}`;
}

function getTextFieldInputBlock(
    inputType: string,
    index: number,
    label: string,
) {
    return {
        id: getIdForInput(inputType, index),
        widget: 'input',
        parent: {
            id: PROMPT_CONTAINER_BLOCK_ID,
            slot: 'children',
        },
        data: {
            label: label,
            value: '',
            type: inputType,
            style: {
                width: '100%',
                padding: '4px',
            },
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
            style: {
                width: '100%',
                padding: '8px',
            },
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
        case INPUT_TYPE_TEXT:
        case INPUT_TYPE_VECTOR:
        case INPUT_TYPE_CUSTOM_QUERY:
            return getTextFieldInputBlock(
                inputType,
                token.index,
                capitalizeLabel(token.key),
            );
        case INPUT_TYPE_DATABASE:
            const label = capitalizeLabel(token.key).includes('Query')
                ? capitalizeLabel(token.key)
                : `${capitalizeLabel(token.key)} Query`;
            return getTextFieldInputBlock(inputType, token.index, label);
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

export function getInputFormatPrompt(
    tokens: Token[],
    inputTypes: object,
): string {
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
            // don't pass database query into the prompt itself
            // we will just use the query results to supplement the prompt at the end
            if (
                inputTypes[token?.linkedInputToken ?? token.index].type ===
                INPUT_TYPE_DATABASE
            ) {
                tokenStrings.push(token.display);
            } else {
                const keyIndex = inputTokenParts.indexOf(token.key);
                inputTokenParts[keyIndex] = `{{block.${getIdForInput(
                    token.linkedInputToken !== undefined
                        ? inputTypes[token.linkedInputToken].type
                        : inputTypes[token.index].type,
                    token.linkedInputToken ?? token.index,
                )}.value}}`;
                tokenStrings.push(inputTokenParts.join(''));
            }
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

    return prompt;
}

function getVectorQuery() {
    return `def runVectorSearch(search_statement:str, vector_engine_id:str, limit:int) -> str:
    from gaas_gpt_vector import VectorEngine
    vector = VectorEngine(engine_id = vector_engine_id, insight_id = '\${i}', insight_folder = '\${if}')
    matches = vector.nearestNeighbor(search_statement = search_statement, limit = limit)
    return ' '.join([matchItem['Content'] for matchItem in matches])`;
}

function getCustomQuery(index: number) {
    return `def runCustom_${index}(search_statement:str) -> str:
    return search_statement`;
}

function getDatabaseQuery() {
    return `def runDatabaseQuery(query:str, database_engine_id:str) -> str:
    from gaas_gpt_database import DatabaseEngine
    databaseEngine = DatabaseEngine(engine_id = database_engine_id, insight_id = '\${i}')
    result_df = databaseEngine.execQuery(query = query)
    return f"Use the following list of objects representing each row in table to inform your answer: {result_df.to_dict(orient='records')}. The are the headers for the table are: {list(result_df.columns)}"`;
}

export function getQueryForPrompt(
    model: string,
    tokens: Token[],
    inputTypes: object,
): Record<string, QueryStateConfig> {
    const prompt = getInputFormatPrompt(tokens, inputTypes);

    // filter out custom input types
    const customInputTypes = Object.fromEntries(
        Object.entries(inputTypes ?? {}).filter(
            ([_, value]) =>
                value?.type === INPUT_TYPE_VECTOR ||
                value?.type === INPUT_TYPE_CUSTOM_QUERY ||
                value?.type === INPUT_TYPE_DATABASE,
        ),
    );

    const buildQueryDefinitionFunctionCalls = (): string => {
        let functionCalls = '';
        Object.keys(customInputTypes).forEach(
            (customInputTokenIndex, index: number) => {
                if (
                    customInputTypes[customInputTokenIndex]?.type ===
                    INPUT_TYPE_VECTOR
                ) {
                    functionCalls += `
    ${customInputTypes[customInputTokenIndex].type}_${index} = runVectorSearch(${customInputTypes[customInputTokenIndex]?.type}_${index}_statement,"${customInputTypes[customInputTokenIndex]?.meta}",limit)
`;
                }
                if (
                    customInputTypes[customInputTokenIndex]?.type ===
                    INPUT_TYPE_CUSTOM_QUERY
                ) {
                    functionCalls += `
    ${customInputTypes[customInputTokenIndex].type}_${index} = runCustom_${index}(${customInputTypes[customInputTokenIndex]?.type}_${index}_statement)
`;
                }
                if (
                    customInputTypes[customInputTokenIndex]?.type ===
                    INPUT_TYPE_DATABASE
                ) {
                    functionCalls += `
    ${customInputTypes[customInputTokenIndex].type}_${index} = runDatabaseQuery(${customInputTypes[customInputTokenIndex]?.type}_${index}_query,"${customInputTypes[customInputTokenIndex]?.meta}")
`;
                }
            },
        );
        return functionCalls;
    };

    const buildQueryDefinitionPromptStatement = (): string => {
        let promptQueryFunctionString = `prompt = search_statement`;
        if (
            Object.values(customInputTypes).some(
                (inputType) =>
                    inputType?.type === INPUT_TYPE_VECTOR ||
                    inputType?.type === INPUT_TYPE_CUSTOM_QUERY,
            )
        ) {
            promptQueryFunctionString += ` + ' Ask based on ' + ${Object.keys(
                customInputTypes,
            )
                .filter(
                    (customInputTokenIndex) =>
                        customInputTypes[customInputTokenIndex].type ===
                            INPUT_TYPE_VECTOR ||
                        customInputTypes[customInputTokenIndex].type ===
                            INPUT_TYPE_CUSTOM_QUERY,
                )
                .map((customInputTokenIndex, index: number) => {
                    return `${customInputTypes[customInputTokenIndex].type}_${index}`;
                })
                .join(` + ' and ' + `)} + '.'`;
        }
        if (
            Object.values(customInputTypes).some(
                (inputType) => inputType?.type === INPUT_TYPE_DATABASE,
            )
        ) {
            promptQueryFunctionString += ` + ${Object.keys(customInputTypes)
                .filter(
                    (customInputTokenIndex) =>
                        customInputTypes[customInputTokenIndex].type ===
                        INPUT_TYPE_DATABASE,
                )
                .map((customInputTokenIndex, index: number) => {
                    return `' ' + ${customInputTypes[customInputTokenIndex].type}_${index}`;
                })
                .join(` + `)}`;
        }
        promptQueryFunctionString += ` + ' Format the result as markdown.'`;
        return promptQueryFunctionString;
    };

    const queryDefinition = `def promptQuery(search_statement:str, ${Object.keys(
        customInputTypes,
    )
        .map((customInputTokenIndex, index: number) => {
            return `${customInputTypes[customInputTokenIndex]?.type}_${index}_${
                customInputTypes[customInputTokenIndex]?.type ===
                INPUT_TYPE_DATABASE
                    ? 'query'
                    : 'statement'
            }:str`;
        })
        .join(', ')}${
        Object.keys(customInputTypes).length ? ', ' : ''
    }limit = 5) -> str:
    import json
    from gaas_gpt_model import ModelEngine
    model = ModelEngine(engine_id = "${model}", insight_id = '\${i}')
    ${buildQueryDefinitionFunctionCalls()}
    ${buildQueryDefinitionPromptStatement()}
    response = model.ask(question = prompt)
    return json.dumps(response[0]['response'])
`;

    const query = `promptQuery("${prompt}"${
        Object.keys(customInputTypes).length ? ', ' : ''
    }${Object.keys(customInputTypes)
        .map((customInputTokenIndex) => {
            return `"{{block.${getIdForInput(
                customInputTypes[customInputTokenIndex].type,
                parseInt(customInputTokenIndex),
            )}.value}}"`;
        })
        .join(', ')})`;

    let queryDefinitionCells = [
        {
            id: 'py-prompt-query-definition',
            widget: 'code',
            parameters: {
                type: 'py',
                code: queryDefinition,
            },
        },
    ];
    Object.keys(customInputTypes).forEach(
        (customInputTokenIndex, index: number) => {
            if (
                customInputTypes[customInputTokenIndex]?.type ===
                INPUT_TYPE_CUSTOM_QUERY
            ) {
                queryDefinitionCells.unshift({
                    id: `py-custom-query-${tokens[customInputTokenIndex].key}-definition`,
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: getCustomQuery(index),
                    },
                });
            }
        },
    );
    if (
        Object.values(customInputTypes).some(
            (inputType) => inputType?.type === INPUT_TYPE_VECTOR,
        )
    ) {
        queryDefinitionCells.unshift({
            id: 'py-vector-search-query-definition',
            widget: 'code',
            parameters: {
                type: 'py',
                code: getVectorQuery(),
            },
        });
    }
    if (
        Object.values(customInputTypes).some(
            (inputType) => inputType?.type === INPUT_TYPE_DATABASE,
        )
    ) {
        queryDefinitionCells.unshift({
            id: 'py-database-query-definition',
            widget: 'code',
            parameters: {
                type: 'py',
                code: getDatabaseQuery(),
            },
        });
    }

    let queryJson: Record<string, QueryStateConfig> = {
        [PROMPT_QUERY_DEFINITION_ID]: {
            id: PROMPT_QUERY_DEFINITION_ID,
            mode: 'automatic',
            cells: queryDefinitionCells,
        },
        [PROMPT_QUERY_ID]: {
            id: PROMPT_QUERY_ID,
            mode: 'manual',
            cells: [
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

    return queryJson;
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
                        display: 'flex',
                        flexDirection: 'column',
                        flexWrap: 'wrap',
                        padding: '24px',
                        gap: '8px',
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
                        padding: '4px',
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
                        padding: '4px',
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
                        display: 'flex',
                        flexDirection: 'column',
                        flexWrap: 'wrap',
                        padding: '24px',
                        gap: '8px',
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
                    style: {},
                    label: 'Submit',
                    loading: `{{query.${PROMPT_QUERY_ID}.isLoading}}`,
                    variant: 'contained',
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
                    style: {
                        padding: '4px',
                    },
                    markdown: `{{query.${PROMPT_QUERY_ID}.output}}`,
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
        const inputBlock = getBlockForInput(token, inputType.type);
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
        builder.inputs.value as Token[],
        builder.inputTypes.value as object,
    );

    const pixel = `CreateAppFromBlocks ( project = [ "${
        builder.title.value
    }" ] , json =["<encode>${JSON.stringify(state)}</encode>"]  ) ;`;

    // create the app
    const { errors, pixelReturn } = await monolithStore.runQuery<[AppMetadata]>(
        pixel,
    );

    if (errors.length > 0) {
        throw new Error(errors.join(','));
    }

    const appId = pixelReturn[0].output.project_id;
    navigate(`/app/${appId}`);
}
