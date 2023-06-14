import React, { useEffect, useState, useRef } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { styled, theme, Select, Icon } from '@semoss/components';
import { mdiDatabase } from '@mdi/js';

import { LoadingScreen } from '@/components/ui';
import { Permissions } from '@/components/database';

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
    // border: 'solid',
});

const StyledLoadWorkflowContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors['grey-2'],
    backgroundColor: theme.colors.base,
    marginTop: theme.space[4],
    border: `${theme.borderWidths.default} solid ${theme.colors['grey-4']}`,
    '@sm': {
        minHeight: '5rem',
    },
    '@md': {
        minHeight: '8rem',
    },
    '@lg': {
        minHeight: '10rem',
    },
    '@xl': {
        minHeight: '15rem',
    },
    '@xxl': {
        minHeight: '30rem',
    },
});

const StyledIcon = styled(Icon, {
    fontSize: '4rem',
});

const StyledDiv = styled('div', {
    display: 'flex',
    // border: 'solid',
});

const StyledChangeDatabase = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
    // border: 'solid',
});

export interface AppInterface {
    app_global: boolean;
    app_id: string;
    app_name: string;
    app_permission: string;
    app_visibility: boolean;

    database_global: boolean;
    database_id: string;
    database_name: string;
    database_visibility: boolean;
    low_database_name: string;
}
export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

export const DatabasePermissionsPage = () => {
    const { adminMode } = useSettings();

    const [apps, setApps] = useState<AppInterface[]>([]);
    const [selectedApp, setSelectedApp] = useState<AppInterface>(null);

    const getApps = useAPI(['getDatabases', adminMode]);

    useEffect(() => {
        setSelectedApp(null);
    }, [apps]);

    useEffect(() => {
        // REST call to get all apps
        if (getApps.status !== 'SUCCESS' || !getApps.data) {
            return;
        }

        setApps(getApps.data as AppInterface[]);

        () => {
            console.warn('Cleaning up getApps');
            setApps([]);
        };
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
        <StyledContainer>
            <>
                <StyledDescription>
                    View and edit settings for databases
                </StyledDescription>
                <div>
                    <Select
                        defaultValue={selectedApp}
                        value={selectedApp}
                        options={apps}
                        getDisplay={getDisplay}
                        onChange={(opt: AppInterface) => {
                            // Set selected app
                            setSelectedApp(opt);
                        }}
                        placeholder="Select an option to view database specific settings"
                    ></Select>
                    {selectedApp ? (
                        <Permissions
                            config={{
                                id: selectedApp.database_id,
                                name: selectedApp.database_name,
                                global: selectedApp.database_global,
                                visibility: selectedApp.database_visibility,
                            }}
                        ></Permissions>
                    ) : (
                        <StyledLoadWorkflowContainer>
                            <StyledIcon
                                size="xl"
                                path={mdiDatabase}
                            ></StyledIcon>
                            <p>SEMOSS is waiting on your selection</p>
                        </StyledLoadWorkflowContainer>
                    )}
                </div>
            </>
        </StyledContainer>
    );
};
