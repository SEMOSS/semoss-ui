import { useCallback, useMemo } from 'react';
import { computed } from 'mobx';

import { Paths, PathValue } from '@/types';
import { ActionMessages, Block, BlockDef, ListenerActions } from '@/stores';
import { copy } from '@/utility';

import { useBlocks } from './useBlocks';

/**
 * useBlockReturn
 */
interface useBlockReturn<D extends BlockDef = BlockDef> {
    /** Data for the block  */
    data: Block<D>['data'];

    /** Listeners on the block  */
    listeners: Record<
        keyof Block<D>['listeners'],
        (
            intercept?: (action: ListenerActions) => ListenerActions | null,
        ) => void
    >;

    /** Slots */
    slots: Block<D>['slots'];

    /** Attributes to add to the block */
    attrs: {
        /** block id of the block */
        'data-block': string;
    };

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
}

/**
 * Access methods for the block
 */
export const useBlock = <D extends BlockDef = BlockDef>(
    id: string,
): useBlockReturn<D> => {
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
        [],
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

    // construct the listeners to add to the widget
    const listeners = useMemo(() => {
        /**
         * Dispatch a message to delete data
         * @param actions - Actions to dispatch
         * @param intercept - Intercept and modify an action
         */
        const dispatchAction = (
            actions: ListenerActions[],
            intercept?: (action: ListenerActions) => ListenerActions | null,
        ) => {
            // go through each one and trigger it
            actions.forEach((a) => {
                // convert back to a normal action
                let action: ListenerActions | null = a;

                // allow the action to be intercepted before dispatch
                if (intercept) {
                    action = intercept(action);
                }

                if (action === null) {
                    return;
                }

                state.dispatch(action);
            });
        };

        // create the listeners
        return Object.keys(block.listeners).reduce((acc, val) => {
            acc[val as keyof Block<D>['listeners']] = dispatchAction.bind(
                null,
                block.listeners[val],
            );

            return acc;
        }, {} as useBlockReturn<D>['listeners']);
    }, [JSON.stringify(block.listeners)]);

    // render the data. It is wrapped in a computed, so it's cached
    const data = computed(() => {
        return copy(block.data, (instance) => {
            if (typeof instance === 'string') {
                return state.calculateParameter(instance);
            }

            return instance;
        });
    }).get();

    return {
        data: data,
        listeners: listeners,
        slots: block.slots,
        attrs: {
            'data-block': block.id,
        },
        setData: setData,
        deleteData: deleteData,
    };
};
