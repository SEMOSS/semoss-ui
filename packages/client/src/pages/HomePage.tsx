import { useEffect, useState, useReducer } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Collapse,
    List,
    Stack,
    Typography,
    Button,
    Grid,
    styled,
    Divider,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    ToggleTabsGroup,
    TextField,
} from '@semoss/ui';

import { useNavigate } from 'react-router-dom';

import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';
import { AppMetadata, AppTileCard, AppLandscapeCard } from '@/components/app';
import { WelcomeModal } from '@/components/welcome';
import {
    FormatListBulletedOutlined,
    SpaceDashboardOutlined,
    Search,
    SearchOff,
} from '@mui/icons-material';

import { Filterbox } from '@/components/ui';
import BUSINESS_INTELLIGENCE from '@/assets/img/Business_Intelligence.jpg';
import TERMINAL from '@/assets/img/Terminal.jpg';
import UPDATED_TERMINAL from '@/assets/img/Updated_Terminal.png';

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

    const [search, setSearch] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(true);
    const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});
    const [mode, setMode] = useState<MODE>('Mine');
    const [favoriteApps, setFavoriteApps] = useState([]);

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

    // get the projects
    const myApps = usePixel<AppMetadata[]>(pixel);

    /**
     * @name favoriteApp
     * @param app
     */
    const favoriteApp = (app) => {
        const favorite = !isFavorited(app.project_id);
        monolithStore
            .setProjectFavorite(app.project_id, favorite)
            .then(() => {
                if (!favorite) {
                    const newFavorites = favoriteApps;
                    for (let i = newFavorites.length - 1; i >= 0; i--) {
                        if (newFavorites[i].project_id === app.project_id) {
                            newFavorites.splice(i, 1);
                        }
                        {
                            newFavorites.splice(i, 1);
                        }
                    }

                    setFavoriteApps(newFavorites);
                } else {
                    // setFavoriteApps(...favoriteApps);
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
        const favorites = favoriteApps;

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
                            color={'primary'}
                            onChange={(e, v) => setMode(v as MODE)}
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
                        Object.entries(metaFilters).length === 0 &&
                        'terminal'.includes(search.toLowerCase()) &&
                        favoriteApps.length > 0 && (
                            <StyledSectionLabel variant="subtitle1">
                                Bookmarked
                            </StyledSectionLabel>
                        )}

                    {favoriteApps.length ? (
                        <StyledSection>
                            {favoriteApps.map((app, i) => {
                                return (
                                    <AppTileCard
                                        key={i}
                                        app={app}
                                        href={`#/app/${app.project_id}`}
                                        onClick={() =>
                                            navigate(`/app/${app.project_id}`)
                                        }
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

                    {'bi'.includes(search.toLowerCase()) &&
                        Object.entries(metaFilters).length === 0 &&
                        'terminal'.includes(search.toLowerCase()) &&
                        mode == 'System' && (
                            <StyledSection>
                                {'bi'.includes(search.toLowerCase()) && (
                                    <AppTileCard
                                        image={BUSINESS_INTELLIGENCE}
                                        app={BUSINESS_INTELLIGENCE_APP}
                                        background="#BADEFF"
                                        href="../../../"
                                        onClick={() => navigate('../../../')}
                                        isFavorite={isFavorited(
                                            BUSINESS_INTELLIGENCE_APP.project_id,
                                        )}
                                        favorite={() => {
                                            favoriteApp(
                                                BUSINESS_INTELLIGENCE_APP,
                                            );
                                        }}
                                    />
                                )}

                                {'terminal'.includes(search.toLowerCase()) && (
                                    <AppTileCard
                                        image={UPDATED_TERMINAL}
                                        app={TERMINAL_APP}
                                        background="#BADEFF"
                                        href="../../../#!/embed-terminal"
                                        onClick={() =>
                                            navigate(
                                                '../../../#!/embed-terminal',
                                            )
                                        }
                                        isFavorite={isFavorited(
                                            TERMINAL_APP.project_id,
                                        )}
                                        favorite={() => {
                                            favoriteApp(TERMINAL_APP);
                                        }}
                                    />
                                )}
                            </StyledSection>
                        )}

                    {'bi'.includes(search.toLowerCase()) &&
                        Object.entries(metaFilters).length === 0 &&
                        'terminal'.includes(search.toLowerCase()) &&
                        myApps.data &&
                        myApps.data.length > 0 && (
                            <StyledSectionLabel variant="subtitle1">
                                All Apps
                            </StyledSectionLabel>
                        )}

                    <StyledSection>
                        {myApps.status === 'SUCCESS' && myApps.data.length > 0
                            ? myApps.data.map((app, i) => {
                                  console.log('app is', app);
                                  return (
                                      <AppTileCard
                                          key={i}
                                          app={app}
                                          href={`#/app/${app.project_id}`}
                                          onClick={() =>
                                              navigate(`/app/${app.project_id}`)
                                          }
                                          appType={app.project_type}
                                          isFavorite={isFavorited(
                                              app.project_id,
                                          )}
                                          favorite={() => {
                                              favoriteApp(app);
                                          }}
                                      />
                                  );
                              })
                            : null}
                    </StyledSection>
                </StyledContentContainer>
            </StyledContainer>
            <WelcomeModal />
        </Page>
    );
});
