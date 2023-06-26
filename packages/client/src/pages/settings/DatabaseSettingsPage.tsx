import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { Select } from '@semoss/components';

import { LoadingScreen } from '@/components/ui';
import { Permissions } from '@/components/database';
import { MonolithStore } from '@/stores/monolith';

export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();

    const [selectedApp, setSelectedApp] =
        useState<Awaited<ReturnType<MonolithStore['getDatabases']>>[number]>(
            null,
        );

    const getApps = useAPI(['getDatabases', adminMode]);

    // reset the selected app when apps change
    useEffect(() => {
        if (getApps.status !== 'SUCCESS') {
            return;
        }

        // reset it
        setSelectedApp(null);
    }, [getApps.status, getApps.data]);

    // show a loading screen when getApps is pending
    if (getApps.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Retrieving databases" />;
    }

    /**
     * @name getDisplay
     * @desc gets display options for the DB dropdown
     * @param option - the object that is specified for the option
     */
    const getDisplay = (option) => {
        return `${formatDBName(option.database_name)} - ${option.database_id}`;
    };

    const formatDBName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    return (
        <>
            <div>
                <Select
                    value={selectedApp}
                    options={getApps.status === 'SUCCESS' ? getApps.data : []}
                    onChange={(opt) => {
                        console.log(opt);
                        // Set selected app
                        setSelectedApp(opt);
                    }}
                    placeholder="Select an option to view database specific settings"
                ></Select>
                {selectedApp ? (
                    <Permissions
                        config={{
                            id: selectedApp.app_id,
                            name: selectedApp.app_name,
                            global: selectedApp.app_global,
                            visibility: selectedApp.app_visibility,
                        }}
                    ></Permissions>
                ) : (
                    <div>
                        <p>SEMOSS is waiting on your selection</p>
                    </div>
                )}
            </div>
        </>
    );
};
