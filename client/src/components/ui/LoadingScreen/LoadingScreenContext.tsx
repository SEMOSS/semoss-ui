import React, { createContext } from 'react';

/**
 * Value
 */
export type LoadingScreenContextType = {
    /** If the loading screen is loading */
    loading: boolean;

    /** Turn on the loading screen */
    start: (message?: React.ReactNode, description?: React.ReactNode) => void;

    /** Turn off the loading screen */
    stop: (message?: React.ReactNode, description?: React.ReactNode) => void;

    /** Force the loading screen on or off */
    set: (
        open: boolean,
        message?: React.ReactNode,
        description?: React.ReactNode,
    ) => void;
};

/**
 * Context
 */
export const LoadingScreenContext =
    createContext<LoadingScreenContextType>(undefined);
