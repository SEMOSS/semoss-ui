import { SyntheticEvent, useCallback, useMemo } from 'react';
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
import { styled, ToggleTabsGroup } from '@semoss/ui';
import { usePixel, useAPI, useRootStore } from '@/hooks';

import { EngineContext, EngineContextType } from '@/contexts/EngineContext';

import { LoadingScreen } from '@/components/ui';
import { EngineShell } from '@/components/engine';

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
    backgroundColor: theme.palette.background.default,
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    borderRadius: '12px 12px 0px 0px',
}));

const StyledDiv = styled('div')(({ theme }) => ({
    width: '100%',
    borderRadius: '12px 12px 0px 0px',
}));

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout = () => {
    const { id } = useParams();
    const { configStore } = useRootStore();
    const resolvedPath = useResolvedPath('');
    const location = useLocation();
    const navigate = useNavigate();

    let engineType: 'database' | 'storage' | 'model' = 'database';

    if (location.pathname.includes('database')) {
        engineType = 'database';
    } else if (location.pathname.includes('storage')) {
        engineType = 'storage';
    } else {
        engineType = 'model';
    }

    // filter metakeys to the ones we want
    const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
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
        ...engineMetaKeys.map((k) => k.metakey),
    ];

    // get the metadata
    const {
        status: engineMetaStatus,
        data: engineMetaData,
        refresh: engineMetaRefresh,
    } = usePixel<{
        markdown?: string;
        tags?: string[];
    }>(
        `GetEngineMetadata(engine=["${id}"], metaKeys=${JSON.stringify([
            metaKeys,
        ])}); `,
    );

    // convert the data into an object
    const values = useMemo(() => {
        if (engineMetaStatus !== 'SUCCESS') {
            return {};
        }

        // Storage and Model currently not sending back Tag or Tags

        return metaKeys.reduce((prev, curr) => {
            // tag and domain either come in as a string or a string[]
            // format these as string[] for autocomplete if comes in as string
            if (curr === 'domain' || curr === 'tag') {
                if (typeof engineMetaData[curr] === 'string') {
                    prev[curr] = [engineMetaData[curr]];
                } else {
                    prev[curr] = engineMetaData[curr];
                }
            } else {
                prev[curr] = engineMetaData[curr];
            }
            return prev;
        }, {});
    }, [engineMetaStatus, engineMetaData, JSON.stringify(metaKeys)]);

    // get the user's role
    const getUserEnginePermission = useAPI(['getUserEnginePermission', id]);

    const tabMenu = [
        {
            label: 'Overview',
            path: '',
            show: true,
        },
        {
            label: 'Metadata',
            path: '/metadata',
            show: engineType === 'database' ? true : false,
        },
        {
            label: 'Settings',
            path: '/settings',
            show: false,
        },
        // {
        //     label: 'Data',
        //     path: '/data',
        //     show: false,
        // },
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

    // if the engine isn't found, navigate to the Home Page
    if (!id || getUserEnginePermission.status === 'ERROR') {
        return <Navigate to={`/catalog?type=${engineType}`} replace />;
    }

    // show a loading screen when it is pending
    if (getUserEnginePermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking Access" />;
    }

    const engineContextType: EngineContextType = {
        type: engineType,
        id: id,
        role: getUserEnginePermission.data.permission,
        refresh: engineMetaRefresh,
        metaVals: values, // Needed so edit button can be in header
    };

    if (
        engineContextType.role === 'EDITOR' ||
        engineContextType.role === 'OWNER'
    ) {
        tabMenu[2].show = true;
        // tabMenu[3].show = true;
    }

    return (
        <EngineContext.Provider value={engineContextType}>
            <EngineShell>
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
                <StyledDocument>
                    <Outlet />
                </StyledDocument>
            </EngineShell>
        </EngineContext.Provider>
    );
};
