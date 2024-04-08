import { useEffect, useState, useReducer, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Collapse,
    Divider,
    styled,
    Stack,
    Typography,
    Search,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    List,
    ButtonGroup,
} from '@semoss/ui';
import {
    ExpandLess,
    ExpandMore,
    FormatListBulletedOutlined,
    SpaceDashboardOutlined,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

import { ENGINE_TYPES } from '@/types';
import { usePixel, useRootStore } from '@/hooks';
import { EngineLandscapeCard, EngineTileCard } from '@/components/engine';
import { Page } from '@/components/ui';

import { ENGINE_ROUTES } from './engine.constants';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledFilter = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    width: '355px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    marginBottom: theme.spacing(4),
}));

const StyledFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    gap: theme.spacing(2),
}));

const StyledFilterSearchContainer = styled('div')(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
}));

const StyledAvatarCount = styled(Avatar)(({ theme }) => ({
    width: theme.spacing(4),
    height: theme.spacing(4),
    fontSize: theme.spacing(1.75),
    fontWeight: 500,
    color: theme.palette.text.primary,
    background: theme.palette.secondary.main,
}));

const StyledContent = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1',
}));

const StyledShowMore = styled(Typography)(({ theme }) => {
    // TODO: Fix typing
    // const palette = theme.palette as CustomPaletteOptions;
    const palette = theme.palette as unknown as {
        primary: Record<string, string>;
        primaryContrast: Record<string, string>;
    };

    return {
        color: palette.primary.main,
        '&:hover': {
            color: palette.primaryContrast['900'],
            cursor: 'pointer',
        },
    };
});

const initialState = {
    favoritedDbs: [],
    databases: [],
    filterSearch: '',
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

interface EngineCatalogPageProps {
    /** Type of the engine to render */
    type: ENGINE_TYPES;
}

/**
 * Catalog landing Page
 * Landing page to view the available engines
 */
export const EngineCatalogPage = observer(
    (props: EngineCatalogPageProps): JSX.Element => {
        const { type } = props;

        // get the matching route
        const route: (typeof ENGINE_ROUTES)[number] | null = useMemo(() => {
            for (const r of ENGINE_ROUTES) {
                if (r.type === type) {
                    return r;
                }
            }

            return null;
        }, [type]);

        const { configStore, monolithStore } = useRootStore();
        const navigate = useNavigate();

        // get a list of the keys
        const databaseMetaKeys =
            configStore.store.config.databaseMetaKeys.filter((k) => {
                return (
                    k.display_options === 'single-checklist' ||
                    k.display_options === 'multi-checklist' ||
                    k.display_options === 'single-select' ||
                    k.display_options === 'multi-select' ||
                    k.display_options === 'single-typeahead' ||
                    k.display_options === 'multi-typeahead'
                );
            });

        // get metakeys to the ones we want
        const metaKeys = databaseMetaKeys.map((k) => {
            return k.metakey;
        });

        const [state, dispatch] = useReducer(reducer, initialState);
        const { favoritedDbs, databases, filterSearch } = state;

        const [offset, setOffset] = useState(0);
        const [canCollect, setCanCollect] = useState(true);
        const canCollectRef = useRef(true);
        canCollectRef.current = canCollect;
        const limit = 15;

        const offsetRef = useRef(0);
        offsetRef.current = offset;
        let scrollEle, scrollTimeout, currentScroll, previousScroll;

        // save the search string
        const [search, setSearch] = useState<string>('');

        // which view we are on
        const [mode, setMode] = useState<'Mine' | 'Discoverable'>('Mine');
        const [view, setView] = useState<'list' | 'tile'>('tile');
        const [filterByVisibility, setFilterByVisibility] = useState(true);

        const dbPixelPrefix: string =
            mode === 'Mine' ? `MyEngines` : 'MyDiscoverableEngines';

        // track the options
        const [filterOptions, setFilterOptions] = useState<
            Record<string, { value: string; count: number }[]>
        >({});

        // track which filters are opened their selected value, and search term
        const [filterVisibility, setFilterVisibility] = useState<
            Record<string, { open: boolean; value: string[]; search: string }>
        >(() => {
            return databaseMetaKeys.reduce((prev, current) => {
                prev[current.metakey] = {
                    open: false,
                    value: [],
                    search: '',
                };

                return prev;
            }, {});
        });

        // track the filter values
        const [filterValues, setFilterValues] = useState<
            Record<string, string[] | string | null>
        >(() => {
            return databaseMetaKeys.reduce((prev, current) => {
                const multiple =
                    current.display_options === 'multi-checklist' ||
                    current.display_options === 'multi-select' ||
                    current.display_options === 'multi-typeahead';

                prev[current.metakey] = multiple ? [] : null;

                return prev;
            }, {});
        });

        // const buttons = ['My Databases', 'Community Databases'];
        const tagColors = [
            'blue',
            'orange',
            'teal',
            'purple',
            'yellow',
            'pink',
            'violet',
            'olive',
        ];

        // construct filters to send to metafilters
        const metaFilters = {};
        for (const key in filterValues) {
            const filter = filterValues[key];
            const filterVal = filterVisibility[key].value;
            if (filter && filterVal.length > 0) {
                metaFilters[key] = filterVal;
            }
        }

        const metaKeysDescription = [...metaKeys, 'description'];

        const getFavoritedDatabases = usePixel(`
        ${dbPixelPrefix}(metaKeys = ${JSON.stringify(
            metaKeysDescription,
        )}, filterWord=["${search}"], onlyFavorites=[true], ${
            route ? `engineTypes=['${route.type}']` : ''
        });
    `);

        const getDatabases = usePixel<
            {
                app_cost: string;
                app_id: string;
                app_name: string;
                app_type: string;
                database_cost: string;
                database_global: boolean;
                database_id: string;
                database_name: string;
                database_type: string;
                database_created_by: string;
                database_date_created: string;
                description: string;
                low_database_name: string;
                permission: number;
                tag: string;
                user_permission: number;
                upvotes: number;
            }[]
        >(
            `${dbPixelPrefix}( metaKeys = ${JSON.stringify(
                metaKeysDescription,
            )} , metaFilters = [ ${JSON.stringify(
                metaFilters,
            )} ] , filterWord=["${search}"], userT = [true], ${
                route ? `engineTypes=['${route.type}'], ` : ''
            } offset=[${offset}], limit=[${limit}]) ;`,
        );

        const getCatalogFilters = usePixel<
            {
                METAKEY: string;
                METAVALUE: string;
                count: number;
            }[]
        >(
            metaKeys.length > 0
                ? `GetEngineMetaValues( ${
                      route ? `engineTypes=['${route.type}'], ` : ''
                  } metaKeys = ${JSON.stringify(metaKeys)} ) ;`
                : '',
        );

        /**
         *
         * @param opt - option for the field color
         * @returns color
         */
        const setFieldOptionColor = (opt: string): string => {
            return tagColors[
                opt
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b) % 8
            ];
        };

        /**
         * @name formatDBName
         * @param str
         * @returns formatted db name
         */
        const formatDBName = (str: string) => {
            let i;
            const frags = str.split('_');
            for (i = 0; i < frags.length; i++) {
                frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
            }
            return frags.join(' ');
        };

        /**
         * @name setSelectedFilters
         * @desc sets filter value for each filter (tag, domain, etc.)
         */
        const setSelectedFilters = (
            filterLabel: string,
            filter: { value: string; count: number },
        ) => {
            // first find specific filter
            const newValue = filterVisibility[filterLabel].value;
            const index = newValue.indexOf(filter.value);

            if (index === -1) {
                newValue.push(filter.value);
            } else {
                newValue.splice(index, 1);
            }

            // Now update filter object to have new selected values
            setFilterVisibility({ ...filterVisibility });
        };

        /**
         * @name setGlobal
         * @param db
         */
        const setGlobal = (db) => {
            monolithStore
                .setEngineGlobal(
                    configStore.store.user.admin,
                    db.database_id,
                    !db.database_global,
                )
                .then((response) => {
                    if (response.data.success) {
                        const newDatabases = [];
                        databases.forEach((database) => {
                            if (database.database_id === db.database_id) {
                                const newCopy = database;
                                newCopy.database_global = !db.database_global;

                                newDatabases.push(newCopy);
                            } else {
                                newDatabases.push(database);
                            }
                        });

                        dispatch({
                            type: 'field',
                            field: 'database',
                            value: newDatabases,
                        });
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        };

        /**
         * @name favoriteDb
         * @param db
         */
        const favoriteDb = (db) => {
            const favorite = !isFavorited(db.database_id);
            monolithStore
                .setEngineFavorite(db.database_id, favorite)
                .then(() => {
                    if (!favorite) {
                        const newFavorites = favoritedDbs;
                        for (let i = newFavorites.length - 1; i >= 0; i--) {
                            if (
                                newFavorites[i].database_id === db.database_id
                            ) {
                                newFavorites.splice(i, 1);
                            }
                        }

                        dispatch({
                            type: 'field',
                            field: 'favoritedDbs',
                            value: newFavorites,
                        });
                    } else {
                        dispatch({
                            type: 'field',
                            field: 'favoritedDbs',
                            value: [...favoritedDbs, db],
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
            const favorites = favoritedDbs;

            if (!favorites) return false;
            return favorites.some((el) => el.database_id === id);
        };

        /**
         * @name upvoteDb
         * @param db
         */
        const upvoteDb = (db) => {
            let pixelString = '';

            if (!db.hasUpvoted) {
                pixelString += `VoteEngine(engine="${db.database_id}", vote=1)`;
            } else {
                pixelString += `UnvoteEngine(engine="${db.database_id}")`;
            }

            monolithStore.runQuery(pixelString).then((response) => {
                const type = response.pixelReturn[0].operationType;
                const pixelResponse = response.pixelReturn[0].output;

                if (type.indexOf('ERROR') === -1) {
                    const newDatabases = [];

                    databases.forEach((database) => {
                        if (database.database_id === db.database_id) {
                            const newCopy = database;
                            newCopy.upvotes = !db.hasUpvoted
                                ? newCopy.upvotes + 1
                                : newCopy.upvotes - 1;
                            newCopy.hasUpvoted = !db.hasUpvoted ? true : false;

                            newDatabases.push(newCopy);
                        } else {
                            newDatabases.push(database);
                        }
                    });

                    dispatch({
                        type: 'field',
                        field: 'database',
                        value: newDatabases,
                    });
                } else {
                    console.error('Error voting for DB');
                }
            });
        };

        const scrollAll = () => {
            currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;
            if (
                currentScroll > scrollEle.scrollHeight * 0.75 &&
                currentScroll > previousScroll
            ) {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }

                scrollTimeout = setTimeout(() => {
                    if (!canCollectRef.current) {
                        return;
                    }

                    setOffset(offsetRef.current + limit);
                }, 500);
            }

            previousScroll = currentScroll;
        };

        /**
         * @desc anytime we change catalogType clean up engines
         */
        useEffect(() => {
            dispatch({
                type: 'field',
                field: 'databases',
                value: [],
            });
            setCanCollect(true);
            setOffset(0);
        }, [route.type]);

        /**
         * @desc Set Databases
         */
        useEffect(() => {
            if (getDatabases.status !== 'SUCCESS') {
                return;
            }

            if (getDatabases.data.length < limit) {
                setCanCollect(false);
            } else {
                if (!canCollectRef.current) {
                    setCanCollect(true);
                }
            }

            const mutateListWithVotes = databases;

            getDatabases.data.forEach((db) => {
                mutateListWithVotes.push({
                    ...db,
                    upvotes: db.upvotes ? db.upvotes : 0,
                    views: 'N/A',
                    trending: 'N/A',
                });
            });

            dispatch({
                type: 'field',
                field: 'databases',
                value: mutateListWithVotes,
            });
        }, [getDatabases.status, getDatabases.data]);

        /**
         * @desc Catalog filters
         */
        useEffect(() => {
            if (getCatalogFilters.status !== 'SUCCESS') {
                return;
            }

            // format the catalog data into a map
            const updated = getCatalogFilters.data.reduce((prev, current) => {
                if (!prev[current.METAKEY]) {
                    prev[current.METAKEY] = [];
                }

                prev[current.METAKEY].push({
                    value: current.METAVALUE,
                    count: current.count,
                    color: setFieldOptionColor(current.METAVALUE),
                });
                return prev;
            }, {});

            setFilterOptions(updated);
        }, [getCatalogFilters.status, getCatalogFilters.data]);

        /**
         * @desc Sets Favorited Engines
         */
        useEffect(() => {
            if (getFavoritedDatabases.status !== 'SUCCESS') {
                return;
            }

            dispatch({
                type: 'field',
                field: 'favoritedDbs',
                value: getFavoritedDatabases.data,
            });
        }, [getFavoritedDatabases.status, getFavoritedDatabases.data]);

        /**
         * @desc infinite scroll
         */
        useEffect(() => {
            scrollEle = document.querySelector('#home__content');

            scrollEle.addEventListener('scroll', scrollAll);
            return () => {
                scrollEle.removeEventListener('scroll', scrollAll);
            };
        }, [scrollEle]);

        // finish loading the page
        if (
            getDatabases.status === 'ERROR' ||
            getCatalogFilters.status === 'ERROR'
        ) {
            return <>ERROR</>;
        }

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
                                <Typography variant={'h4'}>
                                    {route ? route.name : ''} Catalog
                                </Typography>
                                <Search
                                    size="small"
                                    placeholder={`Search ${
                                        route
                                            ? `${route.name}${
                                                  route.name === 'Storage'
                                                      ? ''
                                                      : 's'
                                              }`
                                            : ''
                                    }`}
                                    value={search}
                                    onChange={(e) => {
                                        // Reset databases and reset offset
                                        dispatch({
                                            type: 'field',
                                            field: 'databases',
                                            value: [],
                                        });
                                        setOffset(0);

                                        setSearch(e.target.value);
                                    }}
                                />
                            </Stack>
                            <Stack
                                direction="row"
                                alignItems={'center'}
                                spacing={3}
                            >
                                <Button
                                    size={'large'}
                                    variant={'contained'}
                                    onClick={() => {
                                        if (!route) {
                                            navigate('/import');
                                        } else if (route.type) {
                                            navigate(
                                                `/import?type=${route.type.toLowerCase()}`,
                                            );
                                        }
                                    }}
                                    aria-label={`Navigate to import ${
                                        route ? route.name : 'Engine'
                                    }`}
                                >
                                    Add {route ? route.name : 'Engine'}
                                </Button>

                                <ToggleButtonGroup
                                    size={'small'}
                                    value={view}
                                    color="primary"
                                >
                                    <ToggleButton
                                        color="primary"
                                        onClick={(e, v) => setView(v)}
                                        value={'tile'}
                                        aria-label={'Tile View'}
                                    >
                                        <SpaceDashboardOutlined />
                                    </ToggleButton>

                                    <ToggleButton
                                        color="primary"
                                        onClick={(e, v) => setView(v)}
                                        value={'list'}
                                        aria-label={'List View'}
                                    >
                                        <FormatListBulletedOutlined />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </Stack>
                    </Stack>
                }
            >
                <StyledContainer>
                    <StyledFilter>
                        <StyledFilterList dense={true}>
                            <List.Item
                                secondaryAction={
                                    <List.ItemButton
                                        onClick={() => {
                                            setFilterByVisibility(
                                                !filterByVisibility,
                                            );
                                        }}
                                    >
                                        {filterByVisibility ? (
                                            <ExpandLess />
                                        ) : (
                                            <ExpandMore />
                                        )}
                                    </List.ItemButton>
                                }
                            >
                                <List.ItemText
                                    disableTypography
                                    primary={
                                        <Typography variant="h6">
                                            Filter By
                                        </Typography>
                                    }
                                />
                            </List.Item>

                            <Collapse in={filterByVisibility}>
                                {Object.entries(filterOptions).length ? (
                                    <StyledFilterSearchContainer>
                                        <Search
                                            size={'small'}
                                            placeholder={'Search by...'}
                                            value={filterSearch}
                                            onChange={(e) => {
                                                dispatch({
                                                    type: 'field',
                                                    field: 'filterSearch',
                                                    value: e.target.value,
                                                });
                                            }}
                                            sx={{ width: '100%' }}
                                        />
                                    </StyledFilterSearchContainer>
                                ) : null}

                                {Object.entries(filterOptions).map(
                                    (entries, i) => {
                                        const totalFilters =
                                            Object.entries(
                                                filterOptions,
                                            ).length;
                                        const list = entries[1];
                                        let shownListItems = 0; // for show more functionality
                                        return (
                                            <div key={i}>
                                                <List.Item>
                                                    <List.ItemText
                                                        disableTypography
                                                        primary={
                                                            <Typography
                                                                variant={'h6'}
                                                            >
                                                                {formatDBName(
                                                                    entries[0],
                                                                )}
                                                            </Typography>
                                                        }
                                                    />
                                                </List.Item>
                                                {/* <StyledNestedFilterList dense={true}> */}
                                                {list.map((filterOption, i) => {
                                                    if (
                                                        shownListItems > 4 &&
                                                        !filterVisibility[
                                                            entries[0]
                                                        ].open
                                                    ) {
                                                        return;
                                                    } else {
                                                        if (
                                                            filterOption.value
                                                                .toLowerCase()
                                                                .includes(
                                                                    filterSearch.toLowerCase(),
                                                                )
                                                        ) {
                                                            shownListItems += 1;
                                                            return (
                                                                <List.Item
                                                                    disableGutters
                                                                    key={i}
                                                                >
                                                                    <List.ItemButton
                                                                        disableGutters
                                                                        sx={{
                                                                            paddingLeft:
                                                                                '16px',
                                                                            paddingRight:
                                                                                '16px',
                                                                        }}
                                                                        selected={
                                                                            filterVisibility[
                                                                                entries[0]
                                                                            ].value.indexOf(
                                                                                filterOption.value,
                                                                            ) >
                                                                            -1
                                                                        }
                                                                        onClick={() => {
                                                                            // Reset databases and reset offset
                                                                            dispatch(
                                                                                {
                                                                                    type: 'field',
                                                                                    field: 'databases',
                                                                                    value: [],
                                                                                },
                                                                            );
                                                                            setOffset(
                                                                                0,
                                                                            );

                                                                            setSelectedFilters(
                                                                                entries[0],
                                                                                filterOption,
                                                                            );
                                                                        }}
                                                                        aria-label={
                                                                            filterVisibility[
                                                                                entries[0]
                                                                            ].value.indexOf(
                                                                                filterOption.value,
                                                                            ) >
                                                                            -1
                                                                                ? `Unfilter ${filterOption.value}`
                                                                                : `Filter ${filterOption.value}`
                                                                        }
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: '100%',
                                                                                display:
                                                                                    'flex',
                                                                                justifyContent:
                                                                                    'space-between',
                                                                            }}
                                                                        >
                                                                            <List.ItemText
                                                                                disableTypography
                                                                                primary={
                                                                                    <Typography variant="body1">
                                                                                        {
                                                                                            filterOption.value
                                                                                        }
                                                                                    </Typography>
                                                                                }
                                                                            />
                                                                            <StyledAvatarCount
                                                                                variant={
                                                                                    'rounded'
                                                                                }
                                                                            >
                                                                                {
                                                                                    filterOption.count
                                                                                }
                                                                            </StyledAvatarCount>
                                                                        </div>
                                                                    </List.ItemButton>
                                                                </List.Item>
                                                            );
                                                        }
                                                    }
                                                })}
                                                {shownListItems > 4 && (
                                                    <List.Item>
                                                        <div
                                                            onClick={() => {
                                                                const visibleFilters =
                                                                    {
                                                                        ...filterVisibility,
                                                                    };
                                                                visibleFilters[
                                                                    entries[0]
                                                                ] = {
                                                                    open: !visibleFilters[
                                                                        entries[0]
                                                                    ].open,
                                                                    value: visibleFilters[
                                                                        entries[0]
                                                                    ].value,
                                                                    search: visibleFilters[
                                                                        entries[0]
                                                                    ].search,
                                                                };
                                                                setFilterVisibility(
                                                                    visibleFilters,
                                                                );
                                                            }}
                                                        >
                                                            <StyledShowMore
                                                                variant={
                                                                    'body1'
                                                                }
                                                            >
                                                                Show{' '}
                                                                {filterVisibility[
                                                                    entries[0]
                                                                ].open
                                                                    ? 'Less'
                                                                    : 'More'}
                                                            </StyledShowMore>
                                                        </div>
                                                    </List.Item>
                                                )}
                                                {/* </StyledNestedFilterList> */}
                                                {i + 1 !== totalFilters && (
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Divider></Divider>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </Collapse>
                        </StyledFilterList>
                    </StyledFilter>

                    <StyledContent>
                        <StyledButtonGroup>
                            <Button
                                color="secondary"
                                variant={
                                    mode === 'Mine' ? 'outlined' : 'contained'
                                }
                                onClick={() => {
                                    dispatch({
                                        type: 'field',
                                        field: 'databases',
                                        value: [],
                                    });
                                    setOffset(0);
                                    setMode('Mine');
                                }}
                            >
                                {`My ${
                                    route ? `${route.name}(s)` : 'Engine(s)'
                                }`}
                            </Button>
                            <Button
                                color="secondary"
                                variant={
                                    mode === 'Discoverable'
                                        ? 'outlined'
                                        : 'contained'
                                }
                                onClick={() => {
                                    // Reset engines and reset offset
                                    dispatch({
                                        type: 'field',
                                        field: 'databases',
                                        value: [],
                                    });
                                    setOffset(0);
                                    setMode('Discoverable');
                                }}
                            >
                                {`Discoverable ${
                                    route ? `${route.name}(s)` : 'Engine(s)'
                                }`}
                            </Button>
                        </StyledButtonGroup>

                        {databases.length ? (
                            <Grid container spacing={3}>
                                {databases.map((db) => {
                                    return (
                                        <Grid
                                            item
                                            key={db.database_id}
                                            sm={view === 'list' ? 12 : 12}
                                            md={view === 'list' ? 12 : 6}
                                            lg={view === 'list' ? 12 : 4}
                                            xl={view === 'list' ? 12 : 4}
                                        >
                                            {view === 'list' ? (
                                                <EngineLandscapeCard
                                                    name={formatDBName(
                                                        db.database_name,
                                                    )}
                                                    id={db.database_id}
                                                    tag={db.tag}
                                                    owner={
                                                        db.database_created_by
                                                    }
                                                    description={db.description}
                                                    votes={db.upvotes}
                                                    views={db.views}
                                                    sub_type={db.app_subtype}
                                                    trending={db.trending}
                                                    isGlobal={
                                                        db.database_global
                                                    }
                                                    isUpvoted={db.hasUpvoted}
                                                    isFavorite={isFavorited(
                                                        db.database_id,
                                                    )}
                                                    onClick={() => {
                                                        navigate(
                                                            `${db.database_id}`,
                                                        );
                                                    }}
                                                    favorite={() => {
                                                        favoriteDb(db);
                                                    }}
                                                    upvote={() => {
                                                        upvoteDb(db);
                                                    }}
                                                    global={
                                                        db.user_permission === 1
                                                            ? () => {
                                                                  setGlobal(db);
                                                              }
                                                            : null
                                                    }
                                                />
                                            ) : (
                                                <EngineTileCard
                                                    name={formatDBName(
                                                        db.database_name,
                                                    )}
                                                    id={db.database_id}
                                                    tag={db.tag}
                                                    sub_type={db.app_subtype}
                                                    owner={
                                                        db.database_created_by
                                                    }
                                                    description={db.description}
                                                    votes={db.upvotes}
                                                    views={db.views}
                                                    trending={db.trending}
                                                    isGlobal={
                                                        db.database_global
                                                    }
                                                    isUpvoted={db.hasUpvoted}
                                                    isFavorite={isFavorited(
                                                        db.database_id,
                                                    )}
                                                    favorite={() => {
                                                        favoriteDb(db);
                                                    }}
                                                    onClick={() => {
                                                        navigate(
                                                            `${db.database_id}`,
                                                        );
                                                    }}
                                                    global={
                                                        db.user_permission === 1
                                                            ? () => {
                                                                  setGlobal(db);
                                                              }
                                                            : null
                                                    }
                                                    upvote={() => {
                                                        upvoteDb(db);
                                                    }}
                                                />
                                            )}
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : null}
                    </StyledContent>
                </StyledContainer>
            </Page>
        );
    },
);
