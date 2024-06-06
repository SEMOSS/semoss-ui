import { useEffect, useState, useReducer, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Stack,
    Typography,
    styled,
    ToggleTabsGroup,
    TextField,
    InputAdornment,
} from '@semoss/ui';

import { useNavigate } from 'react-router-dom';

import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';
import { AppMetadata, AppTileCard } from '@/components/app';
import { WelcomeModal } from '@/components/welcome';
import { Search, ArrowDropDown, AddRounded } from '@mui/icons-material';

import { Help } from '@/components/help';
import {
    Popper,
    ClickAwayListener,
    Grow,
    Paper,
    MenuItem,
    MenuList,
    Button,
    ButtonGroup,
} from '@mui/material';

import { Filterbox } from '@/components/ui';

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

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: '1px',
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 11px',
    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
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
    const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});
    const [mode, setMode] = useState<MODE>('Mine');

    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(1);

    // get a list of the keys
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead' ||
                k.display_options === 'select-box'
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
            dispatch({
                type: 'field',
                field: 'apps',
                value: [],
            });
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
    favoritePixel += `(metaKeys = ${JSON.stringify([
        ...metaKeys,
        'description',
    ])}, metaFilters=[${JSON.stringify(
        metaFilters,
    )}], filterWord=["${search}"], onlyFavorites=[true]);`;
    const getFavoritedApps = usePixel(favoritePixel);

    useEffect(() => {
        if (getFavoritedApps.status !== 'SUCCESS') {
            dispatch({
                type: 'field',
                field: 'favoritedApps',
                value: [],
            });
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

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }

        setOpen(false);
    };

    const removeApp = (app) => {
        const updatedApps = apps;
        for (let i = updatedApps.length - 1; i >= 0; i--) {
            if (updatedApps[i].project_id === app.project_id) {
                updatedApps.splice(i, 1);
            }
        }
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

                            <TextField
                                placeholder="Search"
                                size="small"
                                sx={{
                                    width: '200px',
                                }}
                                value={search}
                                variant="outlined"
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="medium" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>
                        {/* <Button
                            size={'large'}
                            variant={'contained'}
                            onClick={() => {
                                navigate('/app/new');
                            }}
                            aria-label={`Open the App Model`}
                        >
                            Create New App
                        </Button> */}
                        <ButtonGroup variant="contained" ref={anchorRef}>
                            <Button
                                onClick={() => {
                                    navigate('/app/new');
                                }}
                                startIcon={<AddRounded />}
                                sx={{
                                    textTransform: 'none',
                                }}
                            >
                                Create New App
                            </Button>
                            <Button
                                size="small"
                                aria-controls={
                                    open ? 'split-button-menu' : undefined
                                }
                                aria-expanded={open ? 'true' : undefined}
                                aria-haspopup="menu"
                                onClick={handleToggle}
                            >
                                <ArrowDropDown />
                            </Button>
                        </ButtonGroup>
                        <Popper
                            sx={{
                                zIndex: 1,
                            }}
                            open={open}
                            anchorEl={anchorRef.current}
                            role={undefined}
                            transition
                            disablePortal
                        >
                            {({ TransitionProps, placement }) => (
                                <Grow
                                    {...TransitionProps}
                                    style={{
                                        transformOrigin:
                                            placement === 'bottom'
                                                ? 'right top'
                                                : 'right bottom',
                                    }}
                                >
                                    <Paper>
                                        <ClickAwayListener
                                            onClickAway={handleClose}
                                        >
                                            <MenuList
                                                id="split-button-menu"
                                                autoFocusItem
                                            >
                                                <MenuItem
                                                    disabled={true}
                                                    onClick={() => {}}
                                                >
                                                    Upload New App
                                                </MenuItem>
                                                <MenuItem
                                                    disabled={true}
                                                    onClick={() => {}}
                                                >
                                                    Code Editor
                                                </MenuItem>
                                                <MenuItem
                                                    disabled={true}
                                                    onClick={() => {}}
                                                >
                                                    UI Builder
                                                </MenuItem>
                                                <MenuItem
                                                    disabled={true}
                                                    onClick={() => {}}
                                                >
                                                    Prompt Builder
                                                </MenuItem>
                                            </MenuList>
                                        </ClickAwayListener>
                                    </Paper>
                                </Grow>
                            )}
                        </Popper>
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
                        <StyledToggleTabsGroup
                            value={mode}
                            onChange={(e: React.SyntheticEvent, val) => {
                                dispatch({
                                    type: 'field',
                                    field: 'databases',
                                    value: [],
                                });
                                setMode(val as MODE);
                            }}
                        >
                            <StyledToggleTabsGroupItem
                                label="My Apps"
                                value={'Mine'}
                            />
                            <StyledToggleTabsGroupItem
                                label="Discoverable"
                                value={'Discoverable'}
                            />
                            <StyledToggleTabsGroupItem
                                label="System Apps"
                                value={'System'}
                            />
                        </StyledToggleTabsGroup>

                        {/* <StyledToggleButtonGroup value={mode}>
                            <ToggleButton
                                color="secondary"
                                value="Mine"
                                onClick={(e, v) => {
                                    dispatch({
                                        type: 'field',
                                        field: 'databases',
                                        value: [],
                                    });
                                    setMode(v as MODE);
                                }}
                            >
                                {'My Apps'}
                            </ToggleButton>
                            <ToggleButton
                                color="secondary"
                                value="Discoverable"
                                onClick={(e, v) => {
                                    dispatch({
                                        type: 'field',
                                        field: 'databases',
                                        value: [],
                                    });
                                    setMode(v as MODE);
                                }}
                            >
                                {'Discoverable Apps'}
                            </ToggleButton>
                            <ToggleButton
                                color="secondary"
                                value="System"
                                onClick={(e, v) => {
                                    dispatch({
                                        type: 'field',
                                        field: 'databases',
                                        value: [],
                                    });
                                    setMode(v as MODE);
                                }}
                            >
                                {'System Apps'}
                            </ToggleButton>
                        </StyledToggleButtonGroup> */}
                    </Stack>

                    {mode != 'System' && favoritedApps.length > 0 ? (
                        <StyledSectionLabel variant="subtitle1">
                            Bookmarked
                        </StyledSectionLabel>
                    ) : null}

                    {mode != 'System' && favoritedApps.length > 0 ? (
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

                    {mode == 'System' && (
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

                    {mode != 'System' && apps.length > 0 ? (
                        <StyledSectionLabel variant="subtitle1">
                            All Apps
                        </StyledSectionLabel>
                    ) : null}

                    {/* do not show favorited apps in all apps view */}
                    {mode != 'System' && apps.length > 0 ? (
                        <StyledSection>
                            {apps
                                .filter(
                                    (app) =>
                                        !favoritedApps.some(
                                            (filterApp) =>
                                                filterApp.project_id ===
                                                app.project_id,
                                        ),
                                )
                                .map((app, i) => {
                                    return (
                                        <AppTileCard
                                            key={i}
                                            app={app}
                                            systemApp={false}
                                            href={`#/app/${app.project_id}`}
                                            onAction={() =>
                                                navigate(
                                                    `/app/${app.project_id}`,
                                                )
                                            }
                                            appType={app.project_type}
                                            isFavorite={isFavorited(
                                                app.project_id,
                                            )}
                                            favorite={() => {
                                                favoriteApp(app);
                                            }}
                                            onDelete={() => {
                                                removeApp(app);
                                            }}
                                        />
                                    );
                                })}
                        </StyledSection>
                    ) : null}
                </StyledContentContainer>
            </StyledContainer>
            <WelcomeModal />
            <Help />
        </Page>
    );
});
