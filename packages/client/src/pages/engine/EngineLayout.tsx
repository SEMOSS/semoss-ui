import { SyntheticEvent, useMemo } from 'react';
import {
    useParams,
    useLocation,
    useResolvedPath,
    Outlet,
    Navigate,
    matchPath,
    useNavigate,
} from 'react-router-dom';
import { styled, ToggleTabsGroup } from '@/component-library';

import { ENGINE_TYPES } from '@/types';
import { EngineContext } from '@/contexts';
import { usePixel, useAPI, useRootStore } from '@/hooks';

import { LoadingScreen } from '@/components/ui';
import { EngineShell } from '@/components/engine';

import { ENGINE_ROUTES } from './engine.constants';

const StyledDocument = styled('div')(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(() => ({
    borderRadius: '12px 12px 0px 0px',
}));

const StyledDiv = styled('div')(() => ({
    width: '100%',
    borderRadius: '12px 12px 0px 0px',
}));

interface EngineLayoutProps {
    /** Type of the engine to render */
    type: ENGINE_TYPES;
}

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineLayout = (props: EngineLayoutProps) => {
    const { type } = props;

    const { id } = useParams();
    const { configStore } = useRootStore();
    const resolvedPath = useResolvedPath('');
    const { pathname } = useLocation();
    const navigate = useNavigate();

    // get the matching route
    const route: (typeof ENGINE_ROUTES)[number] | null = useMemo(() => {
        for (const r of ENGINE_ROUTES) {
            if (r.type === type) {
                return r;
            }
        }

        return null;
    }, [type]);

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

    // get the tabs based on permission
    const tabs = useMemo(() => {
        // must be valid
        if (
            !route ||
            getUserEnginePermission.status !== 'SUCCESS' ||
            !getUserEnginePermission.data
        ) {
            return [];
        }

        // check the permission
        const permission = getUserEnginePermission.data.permission;

        // get the routes based on permission
        return route.specific.filter((t) =>
            t.restrict ? t.restrict.indexOf(permission) > -1 : true,
        );
    }, [
        route,
        getUserEnginePermission.status,
        getUserEnginePermission.data
            ? getUserEnginePermission.data.permission
            : '',
    ]);

    /**
     * Gets active tab
     * @returns index of selectedTab
     */
    const activeTabIdx: number = useMemo(() => {
        if (!route) {
            return -1;
        }

        for (let tabIdx = 0, tabLen = tabs.length; tabIdx < tabLen; tabIdx++) {
            if (
                matchPath(
                    `${resolvedPath.pathname}/${tabs[tabIdx].path}`,
                    pathname,
                )
            ) {
                return tabIdx;
            }
        }

        return -1;
    }, [route, tabs, resolvedPath, pathname]);

    // if the engine isn't found, navigate to the Home Page
    if (!id || getUserEnginePermission.status === 'ERROR') {
        return <Navigate to={`${route.path}`} replace />;
    }

    // show a loading screen when it is pending
    if (getUserEnginePermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking Access" />;
    }

    return (
        <EngineContext.Provider
            value={{
                id: id,
                type: route.type,
                name: route.name,
                role: getUserEnginePermission.data.permission,
                refresh: engineMetaRefresh,
                metaVals: values, // Needed so edit button can be in header
            }}
        >
            <EngineShell>
                {tabs.length > 0 && (
                    <StyledDiv>
                        <StyledToggleTabsGroup
                            boxSx={{
                                borderRadius: '12px 12px 0px 0px',
                                width: '100%',
                            }}
                            value={activeTabIdx}
                            onChange={(e: SyntheticEvent, idx: number) => {
                                // get the specific route
                                const r = tabs[idx];

                                // navigate to it
                                navigate(`${r.path}`);
                            }}
                        >
                            {tabs.map((t) => {
                                return (
                                    <ToggleTabsGroup.Item
                                        key={t.path}
                                        label={t.name}
                                    ></ToggleTabsGroup.Item>
                                );
                            })}
                        </StyledToggleTabsGroup>
                    </StyledDiv>
                )}

                <StyledDocument>
                    <Outlet />
                </StyledDocument>
            </EngineShell>
        </EngineContext.Provider>
    );
};
