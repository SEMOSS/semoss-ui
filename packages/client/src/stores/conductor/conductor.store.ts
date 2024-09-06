import { makeAutoObservable } from 'mobx';
import { Node, Edge } from '@xyflow/react';
import { SerializedState } from '../state';

type NodeTypes =
    | Node
    | {
          id: string;
          type: 'APP';
          position: { x: number; y: number };
          data: {
              appId: string;
              description: string;
              inputs: string[];
              outputs: string[];
              state: SerializedState;
          };
      }
    | {
          id: string;
          type: 'LLM';
          position: { x: number; y: number };
          data: {
              id: string;
              name: string;
              temperature: number;
              token_length: number;
              top_p: number;
          };
      };

export interface ConductorStoreInterface {
    // IMPLEMENTATION 1 -------------------------------------
    inputPool?: Record<string, unknown>;

    steps?: unknown[];

    // IMPLEMENTATION 2 -------------------------------------
    /**
     * Question to be ran through pipeline, we get this from the user in playground
     */
    chat_input?: string;

    /**
     * Inputs user specifies in the interactive panel on playground
     */
    user_inputs?: Record<string, unknown>[];

    /**
     * Structure that we define, the prompt will be ran through this
     */
    nodes?: NodeTypes[];

    /**
     * The relationships between input/output from one node to another
     */
    edges?: Edge[];
}

/**
 * Internal state management of the inputs of steps for conductor
 */
export class ConductorStore {
    private _store: ConductorStoreInterface = {
        inputPool: {},

        steps: [],
    };

    constructor(config: ConductorStoreInterface) {
        // Implementation 1 -------------------------------
        this._store.inputPool = config.inputPool;

        this._store.steps = config.steps;
        // Implementation 2 -------------------------------
        this._store.chat_input = config.chat_input || '';
        this._store.user_inputs = config.user_inputs || [];

        this._store.nodes = config.nodes || [];
        this._store.edges = config.edges || [];

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    get inputPool() {
        return this._store.inputPool;
    }

    get steps() {
        return this._store.steps;
    }

    get chat_input() {
        return this._store.chat_input;
    }

    get user_inputs() {
        return this._store.chat_input;
    }

    get nodes() {
        return this._store.nodes;
    }

    get edges() {
        return this._store.edges;
    }

    flattenVariable(str: string, nodeId: string) {
        return str.replace(/{{(.*?)}}/g, (match) => {
            // try to extract the variable
            const v = this.parseVariable(match, nodeId);

            // if it is not a string, convert to a string
            if (typeof v !== 'string') {
                return JSON.stringify(v);
            }

            return v;
        });
    }

    parseVariable = (expression: string, nodeId: string): unknown => {
        // trim the whitespace
        let cleaned = expression.trim();
        if (!cleaned.startsWith('{{') && !cleaned.endsWith('}}')) {
            return expression;
        }

        // remove the brackets
        cleaned = cleaned.slice(2, -2);

        // get the keys in the path
        const path = cleaned.split('.');

        return 'hey hey';

        return expression;
    };

    updateNode(node, data) {
        console.log(node);

        console.log(data);
    }

    setChatInput(input) {
        this._store.chat_input = input;
    }

    /**
     * Actions
     */
    /**
     * Sets the value for the input
     */
    setInputValue(key: string, value: unknown) {
        console.log(key, value);
        this._store.inputPool[key] = value;
    }
}
