import React from 'react';

import { Button } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { MembersTable, SettingsTiles } from '@/components/settings';

interface ImportAppAccessProps {
    /**
     * Needed to hit member and access level reactors
     */
    appId: string;
    /**
     * Callback that gets called when user is done with this step
     */
    onSuccess: () => void;
}

export const ImportAppAccess = (props: ImportAppAccessProps) => {
    const { appId, onSuccess } = props;
    const { configStore } = useRootStore();

    return (
        <>
            <SettingsContext.Provider
                value={{
                    adminMode: configStore.store.user.admin,
                }}
            >
                <SettingsTiles mode="app" name={'App'} id={appId} />
                <MembersTable id={appId} mode={'app'} name={'app'} />
            </SettingsContext.Provider>
            <Button
                onClick={() => {
                    onSuccess();
                }}
            >
                Next
            </Button>
        </>
    );
};
