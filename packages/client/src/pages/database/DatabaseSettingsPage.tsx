import React from 'react';
import { Permissions } from '@/components/database';
import { useDatabase } from '@/hooks';

export const DatabaseSettingsPage = () => {
    const { id } = useDatabase();

    return (
        <Permissions
            config={{
                id: id,
                name: 'get name',
                global: false,
                permission: 3,
                // visibility: true,
            }}
        />
    );
};
