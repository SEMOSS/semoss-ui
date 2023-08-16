import React, { useCallback, useState } from 'react';
import { Backdrop, CircularProgress, Typography, Stack } from '@semoss/ui';

import { LoadingScreenContext } from './LoadingScreenContext';

export interface LoadingScreenProps {
    /** Content to overlay the Loading Screen on */
    children: React.ReactNode;
}

export const LoadingScreen = (props: LoadingScreenProps): JSX.Element => {
    const { children } = props;

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
            <Backdrop
                open={loading}
                sx={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    zIndex: (theme) =>
                        Math.max.apply(Math, Object.values(theme.zIndex)) + 1,
                }}
            >
                <Stack
                    direction={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    spacing={1}
                >
                    <CircularProgress />
                    <Typography variant="body2">{message}</Typography>
                    <Typography variant="caption">{description}</Typography>
                </Stack>
            </Backdrop>
            {children}
        </LoadingScreenContext.Provider>
    );
};
