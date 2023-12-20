import { useCallback } from 'react';

import { Paths, PathValue } from '@/types';
import { ActionMessages, Block, BlockDef, ListenerActions } from '@/stores';

import { useBlocks } from './useBlocks';

/**
 * useBlockSettingsReturn
 */
interface useBlockSettingsReturn<D extends BlockDef = BlockDef> {
    /** Data for the block  */
    data: Block<D>['data'];

    /** Data for the block  */
    listeners: Block<D>['listeners'];

    /**
     * Dispatch a message to set data
     * @param path - path of the data to set
     * @param value - value of the data to set
     */
    setData: <P extends Paths<Block<D>['data'], 4>>(
        path: P,
        value: PathValue<D['data'], P>,
    ) => void;

    /**
     * Dispatch a message to delete data
     * @param path - path of the data to delete
     */
    deleteData: <P extends Paths<Block<D>['data'], 4>>(path: P) => void;

    /**
     * Dispatch a message to set the listeners
     * @param listeners - listeners to attach to the block
     */
    setListener: (
        listener: keyof Block<D>['listeners'],
        actions: ListenerActions[],
    ) => void;

    /**
     * Dispatch a message to set the queries used on block
     */
    setBlockQueries: (queries: string) => void;
}

/**
 * Access methods for the block
 */
export const useBlockSettings = <D extends BlockDef = BlockDef>(
    id: string,
): useBlockSettingsReturn<D> => {
    // get the store
    const { state } = useBlocks();

    // get the block
    const block = state.getBlock(id);

    // get block
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }

    /**
     * Dispatch a message to set data
     * @param path - path of the data to set
     * @param value - value of the data to set
     */
    const setData = useCallback(
        <P extends Paths<Block<D>['data'], 4>>(
            path: P | null,
            value: PathValue<Block<D>['data'], P>,
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_BLOCK_DATA,
                payload: {
                    id: id,
                    path: path,
                    value: value,
                },
            });
        },
        [id],
    );

    /**
     * Dispatch a message to delete data
     * @param path - path of the data to delete
     */
    const deleteData = useCallback(
        <P extends Paths<Block<D>['data'], 4>>(path: P | null): void => {
            state.dispatch({
                message: ActionMessages.DELETE_BLOCK_DATA,
                payload: {
                    id: id,
                    path: path,
                },
            });
        },
        [],
    );

    /**
     * Dispatch a message to set the listeners
     * @param listener - listener to add to the block
     * @param actions - actions to add to the block
     *
     */
    const setListener = useCallback(
        (
            listener: keyof Block<D>['listeners'],
            actions: ListenerActions[],
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_LISTENER,
                payload: {
                    id: id,
                    listener: listener as string,
                    actions: actions,
                },
            });
        },
        [],
    );

    /**
     * Dispatch a message to set the query dependencies for a block (Loading)
     */
    const setBlockQueries = useCallback((queries?: ''): void => {
        state.dispatch({
            message: ActionMessages.SET_BLOCK_QUERIES,
            payload: {
                id: id,
                queries,
            },
        });
    }, []);

    return {
        data: block.data || {},
        listeners: block.listeners || {},
        setData: setData,
        deleteData: deleteData,
        setListener: setListener,
        setBlockQueries: setBlockQueries,
    };
};
