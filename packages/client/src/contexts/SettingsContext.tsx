import { createContext } from 'react';

export type SettingsContextType = {
    /** True if the Settings is in admin mode */
    adminMode: boolean;
};

/**
 * Context
 */
export const SettingsContext = createContext<SettingsContextType>(undefined);
