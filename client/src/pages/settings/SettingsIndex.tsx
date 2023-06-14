import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SettingsContext, SettingsContextType } from '@/contexts';
import { useRootStore } from '@/hooks';

export const SettingsIndex = ({ children }) => {
    const { monolithStore } = useRootStore();
    const { pathname } = useLocation();

    const [adminMode, setAdminMode] = useState(false);
    const [admin, setAdmin] = useState(false);

    useEffect(() => {
        // Determine whether user is admin
        setIsAdmin();

        () => {
            setAdmin(false);
        };
    }, [pathname]);

    const setIsAdmin = async () => {
        const response = await monolithStore.isAdminUser();

        setAdmin(response);
        // if true default adminMode to true
        if (response) {
            setAdminMode(true);
        }
    };

    const settingsContextType: SettingsContextType = {
        adminMode: adminMode,
    };

    return (
        <SettingsContext.Provider value={settingsContextType}>
            {children}
        </SettingsContext.Provider>
    );
};
