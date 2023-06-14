import React, { useEffect } from 'react';

import { useLoadingScreen } from './useLoadingScreen';

export interface LoadingScreenTriggerProps {
    /** Message to render in the Loading */
    message?: React.ReactNode;

    /** Description to render in the Loading */
    description?: React.ReactNode;
}

export const LoadingScreenTrigger = (
    props: LoadingScreenTriggerProps,
): JSX.Element => {
    const { message, description } = props;

    // get the loading screen
    const { set } = useLoadingScreen();

    // set the loading screen based on the props
    useEffect(() => {
        // force it open
        set(true, message, description);

        // close it
        return () => {
            set(false);
        };
    }, [open, message, description]);

    return null;
};
