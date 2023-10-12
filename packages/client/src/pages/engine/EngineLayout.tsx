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
    const { pathname } = useLocation();
    const navigate = useNavigate();

    let engineType: 'database' | 'storage' | 'model' | 'function' | 'vector' =
        'database';

    if (pathname.includes('model')) {
        engineType = 'model';
    } else if (pathname.includes('function')) {
        engineType = 'function';
    } else if (pathname.includes('vector')) {
        engineType = 'vector';
    } else if (pathname.includes('database')) {
        engineType = 'database';
    } else {
        engineType = 'storage';
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

    // dynamically construct the tabs
    const tabs: { label: string; path: string }[] = [
        {
            label: 'Overview',
            path: '',
        },
    ];

    if (getUserEnginePermission.status === 'SUCCESS') {
        if (
            getUserEnginePermission.data.permission === 'EDIT' ||
            getUserEnginePermission.data.permission === 'OWNER' ||
            getUserEnginePermission.data.permission === 'READ_ONLY'
        ) {
            if (engineType === 'database') {
                tabs.push({
                    label: 'Metadata',
                    path: '/metadata',
                });
            }

            tabs.push({
                label: 'Usage',
                path: '/usage',
            });
        }
        if (
            getUserEnginePermission.data.permission === 'EDIT' ||
            getUserEnginePermission.data.permission === 'OWNER'
        ) {
            tabs.push({
                label: 'Settings',
                path: '/settings',
            });
        }
    }

    /**
     * Gets active tab
     * @returns index of selectedTab
     */
    const activeTabIdx: number = useMemo(() => {
        for (let tabIdx = 0, tabLen = tabs.length; tabIdx < tabLen; tabIdx++) {
            const t = tabs[tabIdx];
            if (matchPath(`${resolvedPath.pathname}${t.path}`, pathname)) {
                return tabIdx;
            }
        }

        return 0;
    }, [tabs, resolvedPath, pathname]);

    // if the engine isn't found, navigate to the Home Page
    if (!id || getUserEnginePermission.status === 'ERROR') {
        return <Navigate to={`/catalog?type=${engineType}`} replace />;
    }

    // show a loading screen when it is pending
    if (getUserEnginePermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking Access" />;
    }

    return (
        <EngineContext.Provider
            value={{
                type: engineType,
                id: id,
                role: getUserEnginePermission.data.permission,
                refresh: engineMetaRefresh,
                metaVals: values, // Needed so edit button can be in header
            }}
        >
            <EngineShell>
                <StyledDiv>
                    <StyledToggleTabsGroup
                        boxSx={{
                            borderRadius: '12px 12px 0px 0px',
                            width: '100%',
                        }}
                        value={activeTabIdx}
                        onChange={(e: SyntheticEvent, val: number) => {
                            const navigateObj = tabs[val];
                            navigate(`.${navigateObj.path}`);
                        }}
                    >
                        {tabs.map((obj, i) => {
                            return (
                                <ToggleTabsGroup.Item
                                    key={i}
                                    label={obj.label}
                                ></ToggleTabsGroup.Item>
                            );
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
