import { BlockJSON, ListenerActions } from './state.types';
import { StateStore } from './state.store';
import { StepStateConfig } from './step.state';
import { QueryStateConfig } from './query.state';

export enum ActionMessages {
    SET_STATE = 'SET_STATE',
    ADD_BLOCK = 'ADD_BLOCK',
    MOVE_BLOCK = 'MOVE_BLOCK',
    REMOVE_BLOCK = 'REMOVE_BLOCK',
    SET_BLOCK_DATA = 'SET_BLOCK_DATA',
    DELETE_BLOCK_DATA = 'DELETE_BLOCK_DATA',
    SET_LISTENER = 'SET_LISTENER',
    SET_QUERY = 'SET_QUERY',
    NEW_QUERY = 'NEW_QUERY',
    DELETE_QUERY = 'DELETE_QUERY',
    UPDATE_QUERY = 'UPDATE_QUERY',
    RUN_QUERY = 'RUN_QUERY',
    NEW_STEP = 'NEW_STEP',
    DELETE_STEP = 'DELETE_STEP',
    UPDATE_STEP = 'UPDATE_STEP',
    RUN_STEP = 'RUN_STEP',
    DISPATCH_EVENT = 'DISPATCH_EVENT',
    SET_BLOCK_QUERIES = 'SET_BLOCK_QUERIES', // John
}

const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};

export type Actions =
    | SetStateAction
    | AddBlockAction
    | MoveBlockAction
    | RemoveBlockAction
    | SetBlockDataAction
    | SetBlockQueriesAction
    | DeleteBlockDataAction
    | SetListenerAction
    | NewQueryAction
    | DeleteQueryAction
    | UpdateQueryAction
    | RunQueryAction
    | NewStepAction
    | DeleteStepAction
    | UpdateStepAction
    | RunStepAction
    | DispatchEventAction;

export interface Action {
    message: string;
    payload: Record<string, unknown>;
}

export interface SetStateAction extends Action {
    message: ActionMessages.SET_STATE;
    payload: {
        blocks?: StateStore['blocks'];
        queries?: StateStore['queries'];
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

export interface SetBlockQueriesAction extends Action {
    message: ActionMessages.SET_BLOCK_QUERIES;
    payload: {
        id: string;
        queries: string;
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

export interface NewQueryAction extends Action {
    message: ActionMessages.NEW_QUERY;
    payload: {
        queryId: string;
        config: Omit<QueryStateConfig, 'id'>;
    };
}

export interface DeleteQueryAction extends Action {
    message: ActionMessages.DELETE_QUERY;
    payload: {
        queryId: string;
    };
}

export interface UpdateQueryAction extends Action {
    message: ActionMessages.UPDATE_QUERY;
    payload: {
        queryId: string;
        path: string | null;
        value: unknown;
    };
}

export interface RunQueryAction extends Action {
    message: ActionMessages.RUN_QUERY;
    payload: {
        queryId: string;
    };
}

export interface NewStepAction extends Action {
    message: ActionMessages.NEW_STEP;
    payload: {
        queryId: string;
        stepId: string;
        previousStepId: string;
        config: Omit<StepStateConfig, 'id'>;
    };
}

export interface DeleteStepAction extends Action {
    message: ActionMessages.DELETE_STEP;
    payload: {
        queryId: string;
        stepId: string;
    };
}

export interface UpdateStepAction extends Action {
    message: ActionMessages.UPDATE_STEP;
    payload: {
        queryId: string;
        stepId: string;
        path: string | null;
        value: unknown;
    };
}

export interface RunStepAction extends Action {
    message: ActionMessages.RUN_STEP;
    payload: {
        queryId: string;
        stepId: string;
    };
}

export interface DispatchEventAction extends Action {
    message: ActionMessages.DISPATCH_EVENT;
    payload: {
        name: string;
        detail?: Record<string, unknown>;
    };
}
