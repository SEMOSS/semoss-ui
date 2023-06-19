import { useContext } from 'react';

import {
    LoadingScreenContext,
    LoadingScreenContextType,
} from './LoadingScreenContext';

export interface useLoadingScreenProps {
    /** Set to force the loading screen on or off */
    loading: boolean;
}

/**
 * Access the current LoadingScreen
 * @returns the LoadingScreen
 */
export function useLoadingScreen(): LoadingScreenContextType {
    const context = useContext(LoadingScreenContext);
    if (context === undefined) {
        throw new Error(
            'useLoadingScreen must be used within LoadingScreenProvider',
        );
    }

    return context;
}
