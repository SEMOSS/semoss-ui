import { createContext } from 'react';

/**
 * Value
 */
export type SettingsContextType = {
    // toggle for admin
    adminMode: boolean;
};

/**
 * Context
 */
export const SettingsContext = createContext<SettingsContextType>(undefined);
