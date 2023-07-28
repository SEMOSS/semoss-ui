import { SyntheticEvent, useCallback, useState, useMemo } from 'react';
import {
    useParams,
    useLocation,
    useResolvedPath,
    Outlet,
    Navigate,
    Link,
    matchPath,
    useNavigate,
} from 'react-router-dom';
import { styled, Stack, ToggleTabsGroup } from '@semoss/ui';
import { usePixel, useAPI, useRootStore } from '@/hooks';

import {
    DatabaseContext,
    DatabaseContextType,
} from '@/contexts/DatabaseContext';

import { LoadingScreen } from '@/components/ui';
import { DatabaseShell } from '@/components/database';

const StyledTab = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if the tab is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    ...theme.typography.button,
    display: 'inline-flex',
    alignItems: 'center',
    height: theme.spacing(4),
    padding: theme.spacing(1),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: selected ? theme.palette.primary.main : 'transparent',
    cursor: 'pointer',
    textDecoration: 'none',
    color: theme.palette.text.primary,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledDocument = styled('div')(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(2),
    // borderWidth: '1px',
    // borderStyle: 'solid',
    // borderColor: theme.palette.divider,
    // borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    borderRadius: '12px 12px 0px 0px',
}));

const StyledDiv = styled('div')(({ theme }) => ({
    width: '100%',
    borderRadius: '12px 12px 0px 0px',
    // backgroundColor: 'rgba(0, 0, 0, 0.38)',
}));

/**
 * Wrap the database routes and add additional funcitonality
 */
export const DatabaseLayout = () => {
    const { id } = useParams();
    const { configStore } = useRootStore();
    const resolvedPath = useResolvedPath('');
    const location = useLocation();
    const navigate = useNavigate();

    // filter metakeys to the ones we want
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.metakey !== 'description' &&
                k.metakey !== 'markdown' &&
                k.metakey !== 'tags'
            );
        },
    );

    // kets to get dbMetaData for
    const metaKeys = [
        'markdown',
        'description',
        // 'tags',  // Comes in as 'tag' either a string or string[]
        ...databaseMetaKeys.map((k) => k.metakey),
    ];

    // get the metadata
    const {
        status: dbMetaStatus,
        data: dbMetaData,
        refresh: dbMetaRefresh,
    } = usePixel<{
        markdown?: string;
        tags?: string[];
    }>(
        `GetDatabaseMetadata(database=["${id}"], metaKeys=${JSON.stringify([
            metaKeys,
        ])}); `,
    );

    // convert the data into an object
    const values = useMemo(() => {
        if (dbMetaStatus !== 'SUCCESS') {
            return {};
        }

        return metaKeys.reduce((prev, curr) => {
            // tag and domain either come in as a string or a string[]
            // format these as string[] for autocomplete if comes in as string
            if (curr === 'domain' || curr === 'tag') {
                if (typeof dbMetaData[curr] === 'string') {
                    prev[curr] = [dbMetaData[curr]];
                } else {
                    prev[curr] = dbMetaData[curr];
                }
            } else {
                prev[curr] = dbMetaData[curr];
            }
            return prev;
        }, {});
    }, [dbMetaStatus, dbMetaData, JSON.stringify(metaKeys)]);

    // get the user's role
    const getUserAppPermission = useAPI(['getUserAppPermission', id]);

    const tabMenu = [
        {
            label: 'Overview',
            path: '',
            show: true,
        },
        {
            label: 'Metadata',
            path: '/metadata',
            show: true,
        },
        {
            label: 'Settings',
            path: '/settings',
            show: false,
        },
        {
            label: 'Data',
            path: '/data',
            show: false,
        },
    ];

    /**
     * Gets active tab
     * @returns index of selectedTab
     */
    const activeTab = useCallback(() => {
        let val = 0;
        tabMenu.forEach((obj, i) => {
            if (
                matchPath(
                    `${resolvedPath.pathname}${obj.path}`,
                    location.pathname,
                )
            ) {
                val = i;
            }
        });
        return val;
    }, [resolvedPath, location]);

    // if the database isn't found, navigate to the Home Page
    if (!id || getUserAppPermission.status === 'ERROR') {
        return <Navigate to="/catalog" replace />;
    }

    // show a loading screen when it is pending
    if (getUserAppPermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking Access" />;
    }

    const databaseContextType: DatabaseContextType = {
        id: id,
        role: getUserAppPermission.data.permission,
        refresh: dbMetaRefresh,
        metaVals: values, // Put this here so edit can be in header
    };

    if (
        databaseContextType.role === 'EDITOR' ||
        databaseContextType.role === 'OWNER'
    ) {
        tabMenu[2].show = true;
        tabMenu[3].show = true;
    }

    return (
        <DatabaseContext.Provider value={databaseContextType}>
            <DatabaseShell>
                <StyledDiv>
                    <StyledToggleTabsGroup
                        boxSx={{
                            borderRadius: '12px 12px 0px 0px',
                            width: '100%',
                        }}
                        value={activeTab()}
                        onChange={(e: SyntheticEvent, val: number) => {
                            const navigateObj = tabMenu[val];
                            navigate(`.${navigateObj.path}`);
                        }}
                    >
                        {tabMenu.map((obj, i) => {
                            if (obj.show) {
                                return (
                                    <ToggleTabsGroup.Item
                                        key={i}
                                        label={obj.label}
                                    ></ToggleTabsGroup.Item>
                                );
                            }
                        })}
                    </StyledToggleTabsGroup>
                </StyledDiv>
                {/* <Stack direction={'row'} alignItems={'center'}>
                    <StyledTab to="" selected={isActive('')}>
                        Home
                    </StyledTab>
                    <StyledTab to="metadata" selected={isActive('metadata')}>
                        Metadata
                    </StyledTab>
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab
                            to="settings"
                            selected={isActive('settings')}
                        >
                            Settings
                        </StyledTab>
                    )}
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab to="replace" selected={isActive('replace')}>
                            Replace Data
                        </StyledTab>
                    )}
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab to="query" selected={isActive('query')}>
                            Query Data
                        </StyledTab>
                    )}
                </Stack> */}
                <StyledDocument>
                    <Outlet />
                </StyledDocument>
            </DatabaseShell>
        </DatabaseContext.Provider>
    );
};
