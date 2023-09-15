import { useCallback, useMemo } from 'react';
import { toJS, computed } from 'mobx';

import { Paths, PathValue } from '@/types';
import { Actions, ActionMessages, Block, WidgetDef } from '@/stores';
import { copy } from '@/utility';

import { useCanvas } from './useCanvas';

/**
 * Widget Props
 */
interface useBlockReturn<W extends WidgetDef> {
    /** Data for the widget  */
    data: Block<W>['data'];

    /** Listeners on the widget  */
    listeners: Record<
        keyof Block<W>['listeners'],
        (intercept?: (action: Actions) => Actions | null) => void
    >;

    /** Slots */
    slots: Block<W>['slots'];

    /** Attributes to add to the widget */
    attrs: {
        /** block id of the widget */
        'data-block': string;
    };

    /**
     * Dispatch a message to set data
     * @param path - path of the data to set
     * @param value - value of the data to set
     */
    setData: <P extends Paths<Block<W>['data'], 4>>(
        path: P,
        value: PathValue<W['data'], P>,
    ) => void;

    /**
     * Dispatch a message to delete data
     * @param path - path of the data to delete
     */
    deleteData: <P extends Paths<Block<W>['data'], 4>>(path: P) => void;
}

/**
 * Access methods for the block
 */
export const useBlock = <W extends WidgetDef>(
    id: string,
): useBlockReturn<W> => {
    // get the store
    const { canvas } = useCanvas();

    // get the block
    const block = canvas.getBlock(id);

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
        <P extends Paths<Block<WidgetDef>['data'], 4>>(
            path: P | null,
            value: PathValue<Block<WidgetDef>['data'], P>,
        ): void => {
            canvas.dispatch({
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
        <P extends Paths<Block<WidgetDef>['data'], 4>>(
            path: P | null,
        ): void => {
            canvas.dispatch({
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
            actions: Actions[],
            intercept?: (action: Actions) => Actions | null,
        ) => {
            // go through each one and trigger it
            actions.forEach((a) => {
                // convert back to a normal action
                let action: Actions | null = toJS(a);

                // allow the action to be intercepted before dispatch
                if (intercept) {
                    action = intercept(action);
                }

                if (action === null) {
                    return;
                }

                canvas.dispatch(action);
            });
        };

        // create the listeners
        return Object.keys(block.listeners).reduce((acc, val) => {
            acc[val as keyof Block<W>['listeners']] = dispatchAction.bind(
                null,
                block.listeners[val],
            );

            return acc;
        }, {} as useBlockReturn<W>['listeners']);
    }, [JSON.stringify(block.listeners)]);

    // render the data. It is wrapped in a computed, so it's cached
    const data = computed(() => {
        return copy(block.data, (instance) => {
            if (typeof instance === 'string') {
                return canvas.calculateParameter(instance);
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
