import React, { useCallback, useState } from 'react';
import { Loading } from '@semoss/components';

import { LoadingScreenContext } from './LoadingScreenContext';

export interface LoadingScreenProps {
    /** Content to overlay the Loading Screen on */
    children: React.ReactNode;

    /** Delay of the loading screen */
    delay?: number;
}

export const LoadingScreen = (props: LoadingScreenProps): JSX.Element => {
    const { children, delay } = props;

    // when the count is > 0 it is loading
    const [count, setCount] = useState(0);

    // store the content
    const [message, setMessage] = useState<React.ReactNode>(null);
    const [description, setDescription] = useState<React.ReactNode>(null);

    // track if it is loading
    const loading = count > 0;

    /**
     * Turn on the loading screen
     */
    const start = useCallback((message = 'Loading', description) => {
        // reset the content
        setMessage(message);
        if (description) {
            setDescription(description);
        }

        // increment the count
        setCount(count + 1);
    }, []);

    /**
     * Turn off the loading screen
     */
    const stop = useCallback(() => {
        setCount(count - 1);
    }, []);

    /**
     * Turn on the loading screen
     */
    const set = useCallback((open, message, description) => {
        // reset the count
        setCount(0);

        if (open) {
            start(message, description);
        } else {
            stop();
        }
    }, []);

    return (
        <LoadingScreenContext.Provider
            value={{
                loading: loading,
                start: start,
                stop: stop,
                set: set,
            }}
        >
            <Loading
                open={loading}
                message={message}
                description={description}
                delay={delay}
            />
            {children}
        </LoadingScreenContext.Provider>
    );
};
