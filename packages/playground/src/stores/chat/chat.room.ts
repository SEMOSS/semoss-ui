import { makeAutoObservable, runInAction } from 'mobx';
import { download, Env, runPixel } from '@semoss/sdk/react';

import { TEMPERATURE, TOKEN_LENGTH } from '@/constants';
import {
    Knowledge,
    MessageAppResponse,
    MessageFunctionResponse,
    MessageParameters,
    MessageResponse,
    Tool,
} from '@/types';
import { ChatMessage } from '@/stores';

export interface ChatRoomInterface {
    /**
     * ID of the room
     */
    roomId: string;

    /**
     *  Track if the room is initialized
     */
    isInitialized: boolean;

    /**
     *  Track if the room is loading
     */
    isLoading: boolean;

    /**
     * Metadata associated with the room
     */
    metadata: {
        /**
         * Name of the room
         */
        name: string;

        /**
         * date the room was created
         */
        dateCreated: string;
    };

    /*
     * Model that is being chatted against
     */
    modelId: string;

    /**
     *  Log of messages
     */
    history: ChatMessage[];

    /*
     * Options that is passed to the model
     */
    options: {
        /*
         * Context that is passed to the model
         */
        instructions: string;

        /*
         * Vector databases loaded into the room
         */
        knowledge: Knowledge | null;

        /*
         * Tools loaded into the room
         */
        tools: Tool[];

        /*
         * Length of the token
         */
        tokenLength: number;

        /*
         * Temperature of the model
         */
        temperature: number;

        /*
         * Whether to auto execute functions or not
         */
        autoExecute: boolean;

        /*
         * Whether to show UI artifacts or not
         */
        showUi: boolean;

        /*
         * Whether to tell LLM to show thought process in steps
         */
        chainOfThought: boolean;
    };

    /**
     *  Sidebar information
     */
    sidebar: {
        /** Track if the sidebar is open */
        isOpen: boolean;

        /** Options to pass into the sidbear */
        options:
            | {
                  type: 'CONTROLS';
              }
            | {
                  type: 'CODE';
                  name: string;
              }
            | {
                  type: 'VECTOR_FILE';
                  name: string;
                  engine: string;
              }
            | {
                  type: 'FUNCTION';
                  response: MessageFunctionResponse;
              }
            | {
                  type: 'APP';
                  response: MessageAppResponse;
              };
    };
}

/**
 * Internal state management of the builder object
 */
export class ChatRoom {
    private _insightID = 'new';
    private _store: ChatRoomInterface = {
        roomId: '',
        isInitialized: false,
        isLoading: false,
        metadata: {
            name: '',
            dateCreated: '',
        },
        modelId: '',
        history: [],
        options: {
            instructions: '',
            knowledge: null,
            tools: [],
            tokenLength: TOKEN_LENGTH,
            temperature: TEMPERATURE,
            autoExecute: false,
            showUi: false,
            chainOfThought: false,
        },
        sidebar: {
            isOpen: false,
            options: { type: 'CONTROLS' },
        },
    };

    constructor(roomId: string) {
        // register the roomId and actions
        this._store.roomId = roomId;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the id of the roomId
     */
    get roomId() {
        return this._store.roomId;
    }

    /**
     * Indicator to chack if it is ready for use
     */
    get isInitialized() {
        return this._store.isInitialized;
    }

    /**
     * Indicator to check if the room is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Metadata associated with the room
     */
    get metadata() {
        return this._store.metadata;
    }

    /**
     * Models that the user is interacting with
     */
    get modelId() {
        return this._store.modelId;
    }

    /**
     * Get the history of the room
     */
    get history() {
        return this._store.history;
    }

    /**
     * Get the options of the room
     */
    get options() {
        return this._store.options;
    }

    /**
     * Get the the artifacts as a map
     */
    get artifacts() {
        return this._store.history.reduce((acc, val) => {
            val.response.map((r) => {
                if (r.type === 'CODE') {
                    acc[r.name] = {
                        name: r.name,
                        content: r.content,
                    };
                }
            });

            return acc;
        }, {} as Record<string, { name: string; content: string }>);
    }

    /**
     * Get the the artifacts as a list
     */
    get artifactsList() {
        return Object.values(this.artifacts);
    }

    /**
     * Get the sidbar information
     */
    get sidebar() {
        return this._store.sidebar;
    }

    /** Setters */
    /**
     * Set the model
     * @param modelId - model to use in the room
     */
    setModel = async (modelId: string) => {
        this._store.modelId = modelId;
    };

    /**
     * Set options
     * @param options - options
     */
    setOptions = async (options: Partial<ChatRoomInterface['options']>) => {
        this._store.options = {
            ...this._store.options,
            ...options,
        };
    };

    /**
     * Set the mdetadata
     * @param metadata - metadata
     */
    setMetadata = async (metadata: Partial<ChatRoomInterface['metadata']>) => {
        this._store.metadata = {
            ...this._store.metadata,
            ...metadata,
        };
    };
    /** Actions */

    /**
     * Initialize the room and load messages if they are there
     */
    initialize = async () => {
        try {
            // only load messages once
            if (this._store.isInitialized) {
                console.error('Room is initialized');
                return;
            }

            // turn on the loading screen
            this.setIsLoading(true);

            // initialize a new insight
            this._insightID = 'new';
            await this.runPixel(`SetContext('${Env.APP}')`);

            // wait for the pixel to run
            const response = await this.runPixel<
                [
                    {
                        message_id: string;
                        room_id: string;
                        model_id: string;
                        model_params: string;
                        context: string;
                        question: string;
                        response: string;
                        user_id: string;
                        date_created: string;
                        comment: string;
                        rating: string;
                    }[],
                ]
            >(`GetRoomMessages(roomId=["${this._store.roomId}"]);`);

            const { output, operationType } = response.pixelReturn[0];

            // throw errors
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as unknown as string);
            }

            runInAction(() => {
                for (const r of output) {
                    // create a new message
                    const m = new ChatMessage(r.question);

                    //parse the response
                    const responseObj = JSON.parse(r.response);

                    if (
                        responseObj?.messageType === 'TOOL' &&
                        responseObj?.response?.name === 'function_engine'
                    ) {
                        const toolInfo = JSON.parse(
                            responseObj?.response?.arguments,
                        );

                        //convert response arguments to MessageParameters type
                        const toolParams = [];
                        if (toolInfo?.map) {
                            Object.keys(toolInfo.map).map((param) => {
                                toolParams.push({
                                    name: param,
                                    type: 'string',
                                    value: toolInfo.map[param],
                                });
                            });
                        }

                        m.saveResponse([
                            {
                                id: toolInfo.id,
                                type: 'FUNCTION',
                                name: responseObj.response.name, //To Do: return the tool name
                                functionId: r.message_id,
                                tool_name: responseObj.response.name,
                                tool_id: responseObj.response.id,
                                parameters: toolParams,
                                content: '',
                            },
                        ]);
                    } else {
                        m.saveResponse([
                            {
                                type: 'CONTENT',
                                content: responseObj.response,
                            },
                        ]);
                    }

                    // save the responses
                    m.saveId(r.message_id);
                    m.saveRating(
                        typeof r.rating === 'boolean'
                            ? { positive: r.rating, comment: r.comment }
                            : null,
                    );

                    // add to the log
                    this._store.history.push(m);
                }
            });

            runInAction(() => {
                this._store.isInitialized = true;
            });
        } finally {
            // turn off the loading screen
            this.setIsLoading(false);
        }
    };

    /**
     * Send a new user message and recieve a response
     * @param question - user message
     */
    askModel = async (
        question: string,
        options?: Partial<ChatRoomInterface['options']>,
    ): Promise<void> => {
        try {
            if (!this._store.modelId) {
                throw new Error('Model is required');
            }

            if (!question) {
                throw new Error('Question is required');
            }

            // turn on the loading screen
            this.setIsLoading(true);

            // options to use with the ask
            if (options) {
                this.setOptions(options);
            }

            // create a new message
            const message = new ChatMessage(question);

            // add it to the log
            this._store.history.push(message);

            // if there are vector dbs query that and get the content
            let knowledge: {
                score: number;
                percent: string;
                source: string;
                content: string;
            }[] = [];
            if (this._store.options.knowledge) {
                knowledge = await this.askVectorCatalog(
                    this._store.options.knowledge.id,
                    question,
                );
            }

            // build the context if it is there
            let context = '';
            if (this._store.options?.instructions) {
                context = this._store.options?.instructions;
            }

            // build the full prompt
            let prompt = '';
            if (knowledge.length) {
                prompt = `
Answer the question

question:${question}

based on the provided context. The context is presented as an array [{"content":"", "source": ""}]. Only use information from this context.

context:${JSON.stringify(
                    knowledge.map((k) => {
                        return {
                            content: k.content,
                            source: k.source,
                        };
                    }),
                )}`;
            } else {
                prompt = question;
            }

            // // reset the typewriter
            // message.resetTypewriter('');

            // // start collecting
            // isCollecting = true;

            // // initial delay collecting the partial
            // setTimeout(() => collectMessage(message), 500);

            // get a list of engine ids
            const engines: string[] = this._store.options.tools.reduce(
                (acc, val) => {
                    if (val.type === 'FUNCTION' || val.type === 'DATABASE') {
                        acc.push(val.id);
                    }

                    return acc;
                },
                [],
            );

            // get a list of app ids
            const apps: string[] = this._store.options.tools.reduce(
                (acc, val) => {
                    if (val.type === 'APP') {
                        acc.push(val.id);
                    }

                    return acc;
                },
                [],
            );

            // wait for the pixel to run
            const response = await this.runPixel<
                [
                    {
                        messageId: string;
                        response: MessageResponse[];
                    },
                ]
            >(
                `AskRoomPrompt(
roomId=["${this._store.roomId}"],
project_tools=${JSON.stringify(apps)},
engine_tools=${JSON.stringify(engines)},
modelId=["${this._store.modelId}"],
${context ? `context=["<encode>${context}</encode>"],` : ''} 
question=["<encode>${prompt}</encode>"], 
paramValues=[${JSON.stringify({
                    max_new_tokens: this._store.options.tokenLength,
                    temperature: this._store.options.temperature,
                })}],
execute_tool=[${this._store.options.autoExecute}],
chain_of_thought=[${this._store.options.chainOfThought}]
);`,
            );

            const { output, operationType } = response.pixelReturn[0];

            // throw errors
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as unknown as string);
            }

            // update the id
            message.saveId(output.messageId);

            // save the new options
            await this.runPixel<
                [
                    {
                        updated: boolean;
                    },
                ]
            >(
                `UpdateRoomOptions(roomId='${
                    this.roomId
                }', roomOptions=[${JSON.stringify(this.options)}]);`,
            );

            //TODO: Modify later
            if (
                this._store.options.chainOfThought === true &&
                this._store.options.autoExecute === false
            ) {
                const conclusion = [...output.response];
                conclusion.push({
                    type: 'CONCLUSION',
                });
                message.saveResponse(conclusion);
            } else {
                // finish based on the full response
                message.saveResponse(output.response);
            }

            // TODO: sync with backend
            // update the sources
            const sourceMap = {};
            for (const k of knowledge) {
                sourceMap[k.source] = true;
            }
            message.updateSources(Object.keys(sourceMap));
        } finally {
            // turn off the loading screen
            this.setIsLoading(false);
        }
    };

    /**
     * Process a App response
     */
    processAppResponse = async (
        messageResponse: MessageAppResponse | MessageFunctionResponse,
        appOutputs: Record<string, unknown>,
    ) => {
        // TODO: Or do we want to pass these outputs to the model for verification
        // TODO: Do you want me to just fill in the tool params And call AddToolResponse?
        messageResponse.content = JSON.stringify(appOutputs);
    };

    /**
     * Process a tool response
     * @param question - user message
     */
    processToolResponse = async (
        messageResponse: MessageAppResponse | MessageFunctionResponse,
        updatedParameters: MessageParameters,
    ): Promise<void> => {
        try {
            // turn on the loading screen
            this.setIsLoading(true);

            // update the parameters
            const parameters: Record<string, unknown> =
                updatedParameters.reduce((acc, val) => {
                    acc[val.name] = val.value;
                    return acc;
                }, {});

            // wait for the pixel to run
            const response = await this.runPixel<[{ response: string }]>(
                `AddToolResponse(
engine=["${this._store.modelId}"],
tool_name=["${messageResponse.tool_name}"],
tool_id=["${messageResponse.id}"],
tool_call_id=["${messageResponse.tool_id}"],
tool_execution_response=["<encode>${JSON.stringify(parameters)}</encode>"]
);`,
            );

            const { output, operationType } = response.pixelReturn[0];

            // throw errors
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as unknown as string);
            }

            // update the content>
            messageResponse.content = output.response;
        } finally {
            // turn off the loading screen
            this.setIsLoading(false);
        }
    };

    /**
     * Record Feedback
     * @param messageId
     * @param rating
     * @param comment
     */
    recordFeedback = async (
        messageId: string,
        rating: boolean,
        comment = '',
    ): Promise<void> => {
        try {
            // wait for the pixel to run
            const response = await this.runPixel<[boolean]>(
                `SubmitRoomFeedback(messageId = ["${messageId}"], text=["${comment}"], rating=[${rating}]);`,
            );

            // throw errors
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output as unknown as string);
            }

            // save the feedback to the message's state
            for (const m of this._store.history) {
                if (m.messageId === messageId) {
                    m.saveRating({
                        positive: rating,
                        comment: comment,
                    });
                }
            }
        } finally {
            // noop
        }
    };

    /**
     *
     * @param messageId
     */
    rewriteMessage = async (messageId: string): Promise<void> => {
        try {
            // turn on the loading screen
            this.setIsLoading(true);

            console.log(`TODO ::: Rewrite ${messageId}`);
        } finally {
            // turn off the loading screen
            this.setIsLoading(false);
        }
    };

    /**
     *
     * @param messageId
     */
    downloadHistory = async (): Promise<void> => {
        try {
            // turn on the loading screen
            this.setIsLoading(true);

            const html = this._store.history
                .map((h) => {
                    return `
<div>${h.question}</div>
<div>${h.responseText}</div>
`;
                })
                .join('\n');

            // wait for the pixel to run
            const { pixelReturn } = await this.runPixel<[string]>(
                `ToPdf( html=["<encode>${html}</encode>"]);`,
            );

            // get the output
            this.download(pixelReturn[0].output);
        } finally {
            // turn off the loading screen
            this.setIsLoading(false);
        }
    };

    /**
     * Sidebar
     */
    /**
     * Open the sidebar
     * @param options - options to pass in
     */
    openSidebar = async (
        options: ChatRoomInterface['sidebar']['options'],
    ): Promise<void> => {
        this._store.sidebar.isOpen = true;
        this._store.sidebar.options = options;
    };

    /**
     * Close the sidebar
     */
    closeSidebar = async (): Promise<void> => {
        this._store.sidebar.isOpen = false;
    };

    /**
     * Helpers
     */
    /**
     * Set the isLoading boolean
     * @param isLoading - is it loading
     */
    private setIsLoading(isLoading: boolean): void {
        this._store.isLoading = isLoading;
    }

    /**
     * Run a pixel
     * @param pixel - pixel
     */
    private runPixel = async <O extends [] | unknown[]>(pixel: string) => {
        // get the response
        const response = await runPixel<O>(pixel, this._insightID);

        if (response.errors.length > 0) {
            throw new Error(response.errors.join(''));
        }

        // store the new insight id
        runInAction(() => {
            this._insightID = response.insightId;
        });

        return response;
    };

    /**
     * Download a file
     * @param fileKey - key
     */
    private download = async (fileKey: string) => {
        // get the response
        await download(this._insightID, fileKey);
    };

    /**
     * Search the VectorDatabase and get results from it based on the question
     * @param id
     * @param question
     * @returns
     */
    private askVectorCatalog = async (id: string, question: string) => {
        const pixel = `VectorDatabaseQuery(engine=["${id}"] , command=["<encode>${question}</encode>"], limit=[5])`;

        const response = await this.runPixel<
            [
                {
                    Score: number;
                    Source: string;
                    Divider: string;
                    Part: string;
                    Content: string;
                }[],
            ]
        >(pixel);

        const { output, operationType } = response.pixelReturn[0];

        // throw the error
        if (operationType.indexOf('ERROR') > -1) {
            throw new Error(output as unknown as string);
        }

        const results: {
            score: number;
            percent: string;
            source: string;
            content: string;
        }[] = [];

        for (let i = 0; i < output.length; i++) {
            if (!output[i].Content) {
                continue;
            }

            results.push({
                score: output[i].Score,
                percent: `${Math.round(output[i].Score * 10000) / 100}%`,
                source: output[i].Source,
                content: output[i].Content,
            });
        }

        return results;
    };
}
