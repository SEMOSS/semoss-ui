import { useEffect, useState } from 'react';

/**
 * Access state from the cache
 */
export const useCacheState = <T>(initialState: T, name: string) => {
    const key = `smss--${name}`;

    // set the data
    const [state, setState] = useState<T>(initialState);

    // load from cache whenever the key changes
    useEffect(() => {
        try {
            const item = localStorage.getItem(key);
            if (item) {
                // try to get the state
                const data = JSON.parse(item);
                setState(data.state);
            }
        } catch (e) {
            console.error(e);
        }
    }, [key]);

    /**
     * Handle changing of the data
     */
    const onChange = (data: T) => {
        // save cache
        localStorage.setItem(
            key,
            JSON.stringify({
                state: data,
            }),
        );

        // update the state
        setState(data);
    };

    return [state, onChange] as const;
};
