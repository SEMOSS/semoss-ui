import { BlockJSON, ListenerActions } from './state.types';
import { StateStoreImplementation } from './state.store';

export enum ActionMessages {
    SET_STATE = 'SET_STATE',
    ADD_BLOCK = 'ADD_BLOCK',
    DUPLICATE_BLOCK = 'DUPLICATE_BLOCK',
    MOVE_BLOCK = 'MOVE_BLOCK',
    REMOVE_BLOCK = 'REMOVE_BLOCK',
    SET_BLOCK_DATA = 'SET_BLOCK_DATA',
    DELETE_BLOCK_DATA = 'DELETE_BLOCK_DATA',
    SET_LISTENER = 'SET_LISTENER',
    SET_QUERY = 'SET_QUERY',
    DELETE_QUERY = 'DELETE_QUERY',
    RUN_QUERY = 'RUN_QUERY',
    DISPATCH_EVENT = 'DISPATCH_EVENT',
}

export type Actions =
    | SetStateAction
    | AddBlockAction
    | DuplicateBlockAction
    | MoveBlockAction
    | RemoveBlockAction
    | SetBlockDataAction
    | DeleteBlockDataAction
    | SetListenerAction
    | SetQueryAction
    | DeleteQueryAction
    | RunQueryAction
    | DispatchEventAction;

export interface Action {
    message: string;
    payload: Record<string, unknown>;
}

export interface SetStateAction extends Action {
    message: ActionMessages.SET_STATE;
    payload: {
        blocks?: StateStoreImplementation['blocks'];
        queries?: StateStoreImplementation['queries'];
    };
}

export interface AddBlockAction extends Action {
    message: ActionMessages.ADD_BLOCK;
    payload: {
        json: BlockJSON;
        position?:
            | null
            | { parent: string; slot: string }
            | {
                  parent: string;
                  slot: string;
                  type: 'before';
                  sibling: string;
              }
            | {
                  parent: string;
                  slot: string;
                  type: 'after';
                  sibling: string;
              };
    };
}

export interface DuplicateBlockAction extends Action {
    message: ActionMessages.DUPLICATE_BLOCK;
    payload: {
        id: string;
        position?:
            | null
            | { parent: string; slot: string }
            | {
                  parent: string;
                  slot: string;
                  type: 'before';
                  sibling: string;
              }
            | {
                  parent: string;
                  slot: string;
                  type: 'after';
                  sibling: string;
              };
    };
}

export interface MoveBlockAction extends Action {
    message: ActionMessages.MOVE_BLOCK;
    payload: {
        id: string;
        position?:
            | null
            | { parent: string; slot: string }
            | {
                  parent: string;
                  slot: string;
                  type: 'before';
                  sibling: string;
              }
            | {
                  parent: string;
                  slot: string;
                  type: 'after';
                  sibling: string;
              };
    };
}

export interface RemoveBlockAction extends Action {
    message: ActionMessages.REMOVE_BLOCK;
    payload: {
        id: string;
        keep: boolean;
    };
}

export interface SetBlockDataAction extends Action {
    message: ActionMessages.SET_BLOCK_DATA;
    payload: {
        id: string;
        path: string | null;
        value: unknown;
    };
}

export interface DeleteBlockDataAction extends Action {
    message: ActionMessages.DELETE_BLOCK_DATA;
    payload: {
        id: string;
        path: string | null;
    };
}

export interface SetListenerAction extends Action {
    message: ActionMessages.SET_LISTENER;
    payload: {
        id: string;
        listener: string;
        actions: ListenerActions[];
    };
}

export interface SetQueryAction extends Action {
    message: ActionMessages.SET_QUERY;
    payload: {
        id: string;
        query: string;
    };
}

export interface DeleteQueryAction extends Action {
    message: ActionMessages.DELETE_QUERY;
    payload: {
        id: string;
    };
}

export interface RunQueryAction extends Action {
    message: ActionMessages.RUN_QUERY;
    payload: {
        id: string;
    };
}

export interface DispatchEventAction extends Action {
    message: ActionMessages.DISPATCH_EVENT;
    payload: {
        name: string;
        detail?: Record<string, unknown>;
    };
}
