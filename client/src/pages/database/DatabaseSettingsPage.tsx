import React from 'react';
import { SettingsIndex } from '../settings/SettingsIndex';
import { Permissions } from '@/components/database';
import { useDatabase } from '@/hooks';

export const DatabaseSettingsPage = () => {
    const { id } = useDatabase();

    return (
        <SettingsIndex>
            <div>Permissions file below</div>
            <p>
                We need the global, visibility, and name passed to the config
                prop. Unless you want me to make that net call in the
                Permissions file
            </p>
            <Permissions
                config={{
                    id: id,
                    name: 'get name',
                    global: false,
                    visibility: true,
                }}
            />
        </SettingsIndex>
    );
};
