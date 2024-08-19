import {
    BlockJSON,
    ListenerActions,
    SerializedState,
    Variable,
    VariableType,
    VariableWithId,
    Variant,
} from './state.types';
import { CellStateConfig } from './cell.state';
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
    NEW_CELL = 'NEW_CELL',
    DELETE_CELL = 'DELETE_CELL',
    UPDATE_CELL = 'UPDATE_CELL',
    RUN_CELL = 'RUN_CELL',
    DISPATCH_EVENT = 'DISPATCH_EVENT',
    ADD_VARIABLE = 'ADD_VARIABLE',
    RENAME_VARIABLE = 'RENAME_VARIABLE',
    EDIT_VARIABLE = 'EDIT_VARIABLE',
    DELETE_VARIABLE = 'DELETE_VARIABLE',
    ADD_DEPENDENCY = 'ADD_DEPENDENCY',
    REMOVE_DEPENDENCY = 'REMOVE_DEPENDENCY',
    ADD_VARIANT = 'ADD_VARIANT',
    EDIT_VARIANT = 'EDIT_VARIANT',
    REMOVE_VARIANT = 'REMOVE_VARIANT', // TODO
}

export type Actions =
    | SetStateAction
    | AddBlockAction
    | MoveBlockAction
    | RemoveBlockAction
    | SetBlockDataAction
    | DeleteBlockDataAction
    | SetListenerAction
    | NewQueryAction
    | DeleteQueryAction
    | UpdateQueryAction
    | RunQueryAction
    | NewCellAction
    | DeleteCellAction
    | UpdateCellAction
    | RunCellAction
    | DispatchEventAction
    | AddVariableAction
    | RenameVariableAction
    | EditVariableAction
    | DeleteVariableAction
    | AddDependencyAction
    | RemoveDependencyAction
    | AddVariantAction
    | EditVariantAction;

export interface Action {
    message: string;
    payload: Record<string, unknown>;
}

export interface SetStateAction extends Action {
    message: ActionMessages.SET_STATE;
    payload: {
        state?: SerializedState;
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

export interface NewCellAction extends Action {
    message: ActionMessages.NEW_CELL;
    payload: {
        queryId: string;
        cellId: string;
        previousCellId: string;
        config: Omit<CellStateConfig, 'id'>;
    };
}

export interface DeleteCellAction extends Action {
    message: ActionMessages.DELETE_CELL;
    payload: {
        queryId: string;
        cellId: string;
    };
}

export interface UpdateCellAction extends Action {
    message: ActionMessages.UPDATE_CELL;
    payload: {
        queryId: string;
        cellId: string;
        path: string | null;
        value: unknown;
    };
}

export interface RunCellAction extends Action {
    message: ActionMessages.RUN_CELL;
    payload: {
        queryId: string;
        cellId: string;
    };
}

export interface DispatchEventAction extends Action {
    message: ActionMessages.DISPATCH_EVENT;
    payload: {
        name: string;
        detail?: Record<string, unknown>;
    };
}

export interface AddDependencyAction extends Action {
    message: ActionMessages.ADD_DEPENDENCY;
    payload: {
        id: string;
        type: VariableType;
    };
}

export interface RemoveDependencyAction extends Action {
    message: ActionMessages.REMOVE_DEPENDENCY;
    payload: {
        id: string;
    };
}

export interface AddVariableAction extends Action {
    message: ActionMessages.ADD_VARIABLE;
    payload: {
        id: string;
        to: string;
        type: VariableType;
        cellId?: string;
    };
}

export interface EditVariableAction extends Action {
    message: ActionMessages.EDIT_VARIABLE;
    payload: {
        id: string;
        from: VariableWithId;
        to: {
            to: string;
            type: VariableType;
            cellId?: string;
        };
    };
}

export interface RenameVariableAction extends Action {
    message: ActionMessages.RENAME_VARIABLE;
    payload: {
        id: string;
        alias: string;
    };
}

export interface DeleteVariableAction extends Action {
    message: ActionMessages.DELETE_VARIABLE;
    payload: {
        id: string;
    };
}

export interface AddVariantAction extends Action {
    message: ActionMessages.ADD_VARIANT;
    payload: {
        id: string;
        variant: Variant;
    };
}

export interface EditVariantAction extends Action {
    message: ActionMessages.EDIT_VARIANT;
    payload: {
        id: string;
        from: Variant;
        to: Variant;
    };
}
