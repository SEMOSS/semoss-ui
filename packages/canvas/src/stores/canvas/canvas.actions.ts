import { WidgetJSON } from './canvas.types';
import { CanvasStoreInterface } from './canvas.store';

export enum ActionMessages {
    SET_STATE = 'SET_STATE',
    ADD_BLOCK = 'ADD_BLOCK',
    MOVE_BLOCK = 'MOVE_BLOCK',
    REMOVE_BLOCK = 'REMOVE_BLOCK',
    SET_BLOCK_DATA = 'SET_BLOCK_DATA',
    DELETE_BLOCK_DATA = 'DELETE_BLOCK_DATA',
    SET_LISTENER = 'SET_LISTENER',
    SET_QUERY = 'SET_QUERY',
    DELETE_QUERY = 'DELETE_QUERY',
    DISPATCH_EVENT = 'DISPATCH_EVENT',
}

export type Actions =
    | SetStateAction
    | AddBlockAction
    | MoveBlockAction
    | RemoveBlockAction
    | SetBlockDataAction
    | DeleteBlockDataAction
    | SetListenerAction
    | SetQueryAction
    | DeleteQueryAction
    | DispatchEventAction;

export interface Action {
    message: string;
    payload: Record<string, unknown>;
}

export interface SetStateAction extends Action {
    message: ActionMessages.SET_STATE;
    payload: {
        blocks?: CanvasStoreInterface['blocks'];
        queries?: CanvasStoreInterface['queries'];
    };
}

export interface AddBlockAction extends Action {
    message: ActionMessages.ADD_BLOCK;
    payload: {
        json: WidgetJSON;
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
        actions: Actions[];
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

export interface DispatchEventAction extends Action {
    message: ActionMessages.DISPATCH_EVENT;
    payload: {
        name: string;
        payload?: unknown;
    };
}
