import { useContext } from 'react';

import { SettingsContext, SettingsContextType } from '@/contexts';

/**
 * Access the current Settings Context
 * @returns the Settings Context
 */
export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within SettingsProvider');
    }

    return context;
}
