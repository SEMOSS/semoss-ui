import { useEffect, useState, useReducer } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Collapse,
    Stack,
    Typography,
    Button,
    styled,
    IconButton,
    ToggleTabsGroup,
    TextField,
} from '@semoss/ui';

import { useNavigate } from 'react-router-dom';

import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';
import { AppMetadata, AppTileCard } from '@/components/app';
import { WelcomeModal } from '@/components/welcome';
import { Search, SearchOff } from '@mui/icons-material';

import { Filterbox } from '@/components/ui';
import UPDATED_TERMINAL from '@/assets/img/updated_terminal.png';
import UPDATED_BUSINESS_INTELLIGENCE from '@/assets/img/updated_business_intelligence.png';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(3),
}));

const StyledSection = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
}));

const StyledContentContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
}));

const StyledSectionLabel = styled(Typography)(() => ({
    size: '16px',
    fontWeight: '500',
}));

type MODE = 'Mine' | 'Discoverable' | 'System';

const initialState = {
    favoritedApps: [],
    apps: [],
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

const BUSINESS_INTELLIGENCE_APP: AppMetadata = {
    project_id: '',
    project_name: 'BI',
    project_type: '',
    project_cost: '',
    project_global: '',
    project_catalog_name: '',
    project_created_by: 'SYSTEM',
    project_created_by_type: '',
    project_date_created: '',
    project_has_portal: false,
    project_portal_name: '',
    project_portal_published_date: '',
    project_published_user: '',
    project_published_user_type: '',
    project_reactors_compiled_date: '',
    project_reactors_compiled_user: '',
    project_reactors_compiled_user_type: '',
    project_favorite: '',
    user_permission: null,
    group_permission: '',
    tag: [],
    description: 'Develop dashboards and visualizations to view data',
};

const TERMINAL_APP: AppMetadata = {
    project_id: '',
    project_name: 'Terminal',
    project_type: '',
    project_cost: '',
    project_global: '',
    project_catalog_name: '',
    project_created_by: 'SYSTEM',
    project_created_by_type: '',
    project_date_created: '',
    project_has_portal: false,
    project_portal_name: '',
    project_portal_published_date: '',
    project_published_user: '',
    project_published_user_type: '',
    project_reactors_compiled_date: '',
    project_reactors_compiled_user: '',
    project_reactors_compiled_user_type: '',
    project_favorite: '',
    user_permission: null,
    group_permission: '',
    tag: [],
    description: 'Execute commands and see a response',
};

/**
 * Landing page
 */
export const HomePage = observer((): JSX.Element => {
    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { favoritedApps, apps } = state;

    const [search, setSearch] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(true);
    const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});
    const [mode, setMode] = useState<MODE>('Mine');

    // get a list of the keys
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = projectMetaKeys.map((k) => {
        return k.metakey;
    });

    let pixel = mode === 'Mine' ? 'MyProjects' : 'MyDiscoverableProjects';

    pixel += `(metaKeys = ${JSON.stringify([
        ...metaKeys,
        'description',
    ])}, metaFilters=[${JSON.stringify(
        metaFilters,
    )}], filterWord=["${search}"], onlyPortals=[true]);`;

    /**
     * @desc Get & Set Apps
     */
    const getApps = usePixel<AppMetadata[]>(pixel);

    useEffect(() => {
        if (getApps.status !== 'SUCCESS') {
            return;
        }

        dispatch({
            type: 'field',
            field: 'apps',
            value: getApps.data,
        });
    }, [getApps.status, getApps.data]);

    /**
     * @desc Get & Sets Favorited Apps
     */
    let favoritePixel =
        mode === 'Mine' ? 'MyProjects' : 'MyDiscoverableProjects';
    favoritePixel += `(onlyFavorites=[true]);`;
    const getFavoritedApps = usePixel(favoritePixel);

    useEffect(() => {
        if (getFavoritedApps.status !== 'SUCCESS') {
            return;
        }

        dispatch({
            type: 'field',
            field: 'favoritedApps',
            value: getFavoritedApps.data,
        });
    }, [getFavoritedApps.status, getFavoritedApps.data]);

    /**
     * @name favoriteApp
     * @desc action to favorite app
     * @param app
     */
    const favoriteApp = (app) => {
        const favorite = !isFavorited(app.project_id);
        monolithStore
            .setProjectFavorite(app.project_id, favorite)
            .then(() => {
                if (!favorite) {
                    const newFavorites = favoritedApps;
                    for (let i = newFavorites.length - 1; i >= 0; i--) {
                        if (newFavorites[i].project_id === app.project_id) {
                            newFavorites.splice(i, 1);
                        }
                        {
                            newFavorites.splice(i, 1);
                        }
                    }

                    dispatch({
                        type: 'field',
                        field: 'favoritedApps',
                        value: newFavorites,
                    });
                } else {
                    dispatch({
                        type: 'field',
                        field: 'favoritedApps',
                        value: [...favoritedApps, app],
                    });
                }
            })
            .catch((err) => {
                // throw error if promise doesn't fulfill
                throw Error(err);
            });
    };

    /**
     * @name isFavorited
     * @param id
     * @desc determines if card is favorited
     */
    const isFavorited = (id) => {
        const favorites = favoritedApps;

        if (!favorites) return false;
        return favorites.some((el) => el.project_id === id);
    };

    return (
        <Page
            header={
                <Stack>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Typography
                                data-tour="app-library-title"
                                variant={'h4'}
                            >
                                Apps
                            </Typography>
                        </Stack>
                        <Button
                            size={'large'}
                            variant={'contained'}
                            onClick={() => {
                                navigate('/app/new');
                            }}
                            aria-label={`Open the App Model`}
                        >
                            Create New App
                        </Button>
                    </Stack>
                </Stack>
            }
        >
            <StyledContainer>
                <div>
                    <Filterbox
                        type={'APP'}
                        onChange={(filters: Record<string, unknown>) => {
                            setMetaFilters(filters);
                        }}
                    />
                </div>
                <StyledContentContainer>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                    >
                        <ToggleTabsGroup
                            value={mode}
                            color={'default'}
                            onChange={(e, v) => {
                                dispatch({
                                    type: 'field',
                                    field: 'apps',
                                    value: [],
                                });
                                setMode(v as MODE);
                            }}
                        >
                            <ToggleTabsGroup.Item
                                label="My Apps"
                                value={'Mine'}
                            />
                            <ToggleTabsGroup.Item
                                label="Discoverable Apps"
                                value={'Discoverable'}
                            />
                            <ToggleTabsGroup.Item
                                label="System Apps"
                                value={'System'}
                            />
                        </ToggleTabsGroup>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            justifyContent={'flex-end'}
                        >
                            <Collapse orientation="horizontal" in={showSearch}>
                                <TextField
                                    placeholder="Search"
                                    size="small"
                                    sx={{
                                        width: '200px',
                                    }}
                                    value={search}
                                    variant="outlined"
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Collapse>
                            <IconButton
                                color="default"
                                size="small"
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                    setSearch('');
                                }}
                            >
                                {showSearch ? (
                                    <SearchOff fontSize="medium" />
                                ) : (
                                    <Search fontSize="medium" />
                                )}
                            </IconButton>
                        </Stack>
                    </Stack>

                    {'bi'.includes(search.toLowerCase()) &&
                    'terminal'.includes(search.toLowerCase()) &&
                    favoritedApps.length > 0 ? (
                        <StyledSectionLabel variant="subtitle1">
                            Bookmarked
                        </StyledSectionLabel>
                    ) : null}

                    {'bi'.includes(search.toLowerCase()) &&
                    'terminal'.includes(search.toLowerCase()) &&
                    favoritedApps.length > 0 ? (
                        <StyledSection>
                            {favoritedApps.map((app, i) => {
                                return (
                                    <AppTileCard
                                        key={i}
                                        app={app}
                                        systemApp={false}
                                        href={`#/app/${app.project_id}`}
                                        onAction={() =>
                                            navigate(`/app/${app.project_id}`)
                                        }
                                        appType={app.project_type}
                                        isFavorite={isFavorited(app.project_id)}
                                        favorite={() => {
                                            favoriteApp(app);
                                        }}
                                    />
                                );
                            })}
                        </StyledSection>
                    ) : null}

                    {'bi'.includes(search.toLowerCase()) &&
                        Object.entries(metaFilters).length === 0 &&
                        'terminal'.includes(search.toLowerCase()) &&
                        mode == 'System' && (
                            <StyledSectionLabel variant="subtitle1">
                                All Apps
                            </StyledSectionLabel>
                        )}

                    {mode == 'System' && (
                        <StyledSection>
                            {'bi'.includes(search.toLowerCase()) && (
                                <AppTileCard
                                    app={BUSINESS_INTELLIGENCE_APP}
                                    background="#BADEFF"
                                    href="../../../"
                                    onAction={() => navigate('../../../')}
                                    systemApp={true}
                                    appType={'BI'}
                                />
                            )}

                            {'terminal'.includes(search.toLowerCase()) && (
                                <AppTileCard
                                    // image={UPDATED_TERMINAL}
                                    app={TERMINAL_APP}
                                    background="#BADEFF"
                                    href="../../../#!/embed-terminal"
                                    onAction={() =>
                                        navigate('../../../#!/embed-terminal')
                                    }
                                    systemApp={true}
                                    appType={'TERMINAL'}
                                />
                            )}
                        </StyledSection>
                    )}

                    {'bi'.includes(search.toLowerCase()) &&
                    Object.entries(metaFilters).length === 0 &&
                    'terminal'.includes(search.toLowerCase()) &&
                    apps.length > 0 ? (
                        <StyledSectionLabel variant="subtitle1">
                            All Apps
                        </StyledSectionLabel>
                    ) : null}

                    {apps.length > 0 ? (
                        <StyledSection>
                            {apps.map((app, i) => {
                                return (
                                    <AppTileCard
                                        key={i}
                                        app={app}
                                        systemApp={false}
                                        href={`#/app/${app.project_id}`}
                                        onAction={() =>
                                            navigate(`/app/${app.project_id}`)
                                        }
                                        appType={app.project_type}
                                        isFavorite={isFavorited(app.project_id)}
                                        favorite={() => {
                                            favoriteApp(app);
                                        }}
                                    />
                                );
                            })}
                        </StyledSection>
                    ) : null}
                </StyledContentContainer>
            </StyledContainer>
            <WelcomeModal />
        </Page>
    );
});
