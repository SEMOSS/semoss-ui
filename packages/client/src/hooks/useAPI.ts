import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '@semoss/components';

import { useRootStore } from './useRootStore';
import { MonolithStore } from '@/stores';

interface APIState<A extends keyof MonolithStore> {
    /** Status of the api call */
    status: 'INITIAL' | 'LOADING' | 'SUCCESS' | 'ERROR';
    /** Data returned from the api call */
    data?: Awaited<ReturnType<MonolithStore[A]>>;
    /** Error returned from the api call */
    error?: Error;
}

interface APIConfig<A extends keyof MonolithStore> {
    /** Initial Data */
    data: APIState<A>['data'];
}

interface useAPI<A extends keyof MonolithStore> extends APIState<A> {
    /** Refresh and reexecute the api */
    refresh: () => void;
    /** Update the data with new information */
    update: (data: APIState<A>['data']) => void;
}

/**
 * Execute an api on the backend and recieve a response
 *
 * @param api - api string to call
 *
 * @returns Information about the api response
 */
export function useAPI<A extends keyof MonolithStore>(
    api: [A, ...Parameters<MonolithStore[A]>] | [] | undefined | null,
    config?: Partial<APIConfig<A>>,
): useAPI<A> {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // store the initial config options
    const options: APIConfig<A> = useMemo(() => {
        return {
            data: undefined,
            ...config,
        };
    }, [config]);

    // store the state
    const [count, setCount] = useState(0);
    const [state, setState] = useState<APIState<A>>(() => {
        const s: APIState<A> = {
            status: 'INITIAL',
        };

        if (options.data !== undefined) {
            s.data = options.data;
        }

        return s;
    });

    /**
     * Increment the count, triggering a refresh of the api
     */
    const refresh = useCallback(() => {
        setCount(count + 1);
    }, [count]);

    /**
     * Update the data with new data
     */
    const update = useCallback(
        (data: APIState<A>['data']) => {
            setState({
                ...state,
                data: data,
            });
        },
        [state],
    );

    // get the data
    useEffect(() => {
        // track if it has been cancelled
        let isCancelled = false;

        const run = async () => {
            // no api reset it
            if (!api || api.length === 0) {
                setState({
                    status: 'INITIAL',
                    data: options.data,
                });

                return;
            }

            setState({
                status: 'LOADING',
            });

            try {
                const [func, ...args] = api;

                const response = await monolithStore[func].apply(null, args);

                // ignore if its cancelled
                if (isCancelled) {
                    return;
                }

                // set as success
                setState({
                    status: 'SUCCESS',
                    data: response,
                });
            } catch (error) {
                // ignore if its cancelled
                if (isCancelled) {
                    return;
                }

                notification.add({
                    color: 'error',
                    content: error.message,
                });

                setState({
                    status: 'ERROR',
                    error: error,
                });
            }
        };

        // run it
        run();

        return () => {
            isCancelled = true;
        };
    }, [JSON.stringify(api), count]);

    return {
        ...state,
        refresh: refresh,
        update: update,
    };
}
