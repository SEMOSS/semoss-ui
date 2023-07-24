import { useEffect, useState, useReducer } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Chip,
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
} from '@semoss/ui';
import {
    DataObjectOutlined,
    ExpandLess,
    ExpandMore,
    FormatListBulletedOutlined,
    Inventory2Outlined,
    MenuBookOutlined,
    People,
    SpaceDashboardOutlined,
} from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';

import defaultDBImage from '@/assets/img/placeholder.png';
import { DatabaseLandscapeCard, DatabaseTileCard } from '@/components/database';
import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';

import { Database } from '@/assets/img/Database';

const StyledStack = styled(Stack)(({ theme }) => ({
    // paddingTop: theme.spacing(1)
}));

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledFitler = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '355px',
    gap: theme.spacing(2),
}));

const StyledFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    background: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
}));

const StyledChipList = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    marginLeft: theme.spacing(2),
    gap: theme.spacing(2),
}));

const StyledFilter = styled('div')(({ theme }) => ({
    // borderBottom: `2px solid ${theme.palette.divider}`,
    // '&:last-child': {
    //     borderBottom: 'none', // Remove the border-bottom for the last child
    //     boxShadow: 'none', // Remove the box-shadow for the last child
    // },
}));

const StyledNestedFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    marginRight: theme.spacing(2),
}));

const StyledAvatarCount = styled(Avatar)(({ theme }) => ({
    width: '32px',
    height: '32px',
    color: theme.palette.grey['100'],
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1',
}));

const initialState = {
    favoritedDbs: [],
    databases: [],
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

/**
 * Catalog landing Page
 * Landing page to view the available datasets and search through it
 */
export const CatalogPage = observer((): JSX.Element => {
    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const { search: catalogParams } = useLocation();

    /** This page is shared by db, storage, model */
    let catalogType = '';

    switch (catalogParams) {
        case '':
            catalogType = 'database';
            break;
        case '?type=database':
            catalogType = 'database';
            break;
        case '?type=model':
            catalogType = 'model';
            break;
        case '?type=storage':
            catalogType = 'storage';
            break;
    }

    // get a list of the keys
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
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
    const metaKeys = databaseMetaKeys.map((k) => {
        return k.metakey;
    });

    const [state, dispatch] = useReducer(reducer, initialState);
    const { favoritedDbs, databases } = state;

    // save the search string
    const [search, setSearch] = useState<string>('');

    // which view we are on
    const [mode, setMode] = useState<string>('My Databases');
    const [view, setView] = useState<'list' | 'tile'>('tile');

    const dbPixelPrefix: string =
        mode === 'My Databases' ? `MyEngines` : 'MyDiscoverableEngines';

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, { value: string; count: number }[]>
    >({});

    // track which filters are opened as well as value
    const [filterVisibility, setFilterVisibility] = useState<
        Record<string, { open: boolean; value: string[] }>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = {
                open: false,
                value: [],
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
    // console.log('new', metaKeysDescription)    // metaKeysDescription.push('description');

    const getFavoritedDatabases = usePixel(`
        ${dbPixelPrefix}(metaKeys = ${JSON.stringify(
        metaKeysDescription,
    )}, filterWord=["${search}"], onlyFavorites=[true]);
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
        )} ] , filterWord=["${search}"], userT = [true]) ;`,
    );

    const getCatalogFilters = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(
        metaKeys.length > 0
            ? `GetDatabaseMetaValues ( metaKeys = ${JSON.stringify(
                  metaKeys,
              )} ) ;`
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
            .setDatabaseGlobal(
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
            .setDatabaseFavorite(db.database_id, favorite)
            .then((response) => {
                if (!favorite) {
                    const newFavorites = favoritedDbs;
                    for (let i = newFavorites.length - 1; i >= 0; i--) {
                        if (newFavorites[i].database_id === db.database_id) {
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
     * @desc catalog filters
     */
    useEffect(() => {
        if (getDatabases.status !== 'SUCCESS') {
            return;
        }

        const mutateListWithVotes = [];

        getDatabases.data.forEach((db, i) => {
            mutateListWithVotes.push({
                ...db,
                upvotes: db.upvotes ? db.upvotes : 0,
                hasVoted: false,
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
     * @desc catalog filters
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

        // mimic other filters for testing
        updated['domain'] = [
            {
                color: 'purple',
                count: 1,
                value: 'One',
            },
            {
                color: 'purple',
                count: 1,
                value: 'Two',
            },
        ];

        setFilterOptions(updated);
    }, [getCatalogFilters.status, getCatalogFilters.data]);

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
                <StyledStack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    spacing={4}
                >
                    <Stack direction="row" alignItems={'center'} spacing={2}>
                        <Typography variant={'h4'}>Catalog</Typography>
                        <Search
                            size={'small'}
                            label={'Search'}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                        />
                    </Stack>
                    <Stack direction="row" alignItems={'center'} spacing={3}>
                        <Button variant={'contained'}>Add Database</Button>

                        <ToggleButtonGroup
                            size={'small'}
                            value={view}
                            color="primary"
                        >
                            <ToggleButton
                                color="primary"
                                onClick={(e, v) => setView('tile')}
                                value={'tile'}
                            >
                                <SpaceDashboardOutlined />
                            </ToggleButton>
                            <ToggleButton
                                color="primary"
                                onClick={(e, v) => setView('list')}
                                value={'list'}
                            >
                                <FormatListBulletedOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </StyledStack>
            }
        >
            <StyledContainer>
                <StyledFitler>
                    <StyledFilterList dense={true}>
                        <List.Item>
                            <List.ItemButton
                                selected={catalogType === 'database'}
                                onClick={() => {
                                    navigate(`/catalog?type=database`);
                                }}
                            >
                                <List.Icon>
                                    <DataObjectOutlined />
                                </List.Icon>
                                <List.ItemText primary={'Data Catalog'} />
                            </List.ItemButton>
                        </List.Item>
                        <List.Item>
                            <List.ItemButton
                                selected={catalogType === 'storage'}
                                onClick={() => {
                                    navigate(`/catalog?type=storage`);
                                }}
                            >
                                <List.Icon>
                                    <Inventory2Outlined />
                                </List.Icon>
                                <List.ItemText primary={'Storage Catalog'} />
                            </List.ItemButton>
                        </List.Item>
                        <List.Item>
                            <List.ItemButton
                                selected={catalogType === 'model'}
                                onClick={() => {
                                    navigate(`/catalog?type=model`);
                                }}
                            >
                                <List.Icon>
                                    <MenuBookOutlined />
                                </List.Icon>
                                <List.ItemText primary={'Model Catalog'} />
                            </List.ItemButton>
                        </List.Item>
                    </StyledFilterList>

                    <StyledFilterList dense={true}>
                        <List.Item>
                            <List.ItemText primary={'Filter By'} />
                        </List.Item>

                        {catalogType === 'database' && (
                            <StyledChipList>
                                <Chip
                                    label={'My Databases'}
                                    color={
                                        mode === 'My Databases'
                                            ? 'primary'
                                            : 'default'
                                    }
                                    onClick={() => setMode('My Databases')}
                                ></Chip>
                                <Chip
                                    label={'Discoverable Databases'}
                                    color={
                                        mode === 'Discoverable Databases'
                                            ? 'primary'
                                            : 'default'
                                    }
                                    onClick={() => {
                                        setMode('Discoverable Databases');
                                    }}
                                ></Chip>
                            </StyledChipList>
                        )}

                        {/* <StyledFilterContainer> */}
                        {Object.entries(filterOptions).map((entries, i) => {
                            const list = entries[1];
                            return (
                                <StyledFilter key={i}>
                                    <List.Item
                                        secondaryAction={
                                            <List.ItemButton
                                                onClick={() => {
                                                    const visibleFilters = {
                                                        ...filterVisibility,
                                                    };
                                                    visibleFilters[entries[0]] =
                                                        {
                                                            open: !visibleFilters[
                                                                entries[0]
                                                            ].open,
                                                            value: [],
                                                        };

                                                    setFilterVisibility(
                                                        visibleFilters,
                                                    );
                                                }}
                                            >
                                                {filterVisibility[entries[0]]
                                                    .open ? (
                                                    <ExpandLess />
                                                ) : (
                                                    <ExpandMore />
                                                )}
                                            </List.ItemButton>
                                        }
                                    >
                                        <List.ItemText
                                            primary={formatDBName(entries[0])}
                                        />
                                    </List.Item>
                                    <Collapse
                                        in={filterVisibility[entries[0]].open}
                                    >
                                        {/* <TextField
                                            label={} 
                                        /> */}
                                        <StyledNestedFilterList dense={true}>
                                            {list.map((filterOption, i) => {
                                                return (
                                                    <List.Item
                                                        key={i}
                                                        secondaryAction={
                                                            <StyledAvatarCount
                                                                variant={
                                                                    'rounded'
                                                                }
                                                                sx={{
                                                                    height: '32px',
                                                                    width: '32px',
                                                                }}
                                                            >
                                                                {
                                                                    filterOption.count
                                                                }
                                                            </StyledAvatarCount>
                                                        }
                                                    >
                                                        <List.ItemButton
                                                            selected={
                                                                filterVisibility[
                                                                    entries[0]
                                                                ].value.indexOf(
                                                                    filterOption.value,
                                                                ) > -1
                                                            }
                                                            onClick={() => {
                                                                setSelectedFilters(
                                                                    entries[0],
                                                                    filterOption,
                                                                );
                                                            }}
                                                        >
                                                            <List.ItemText
                                                                primary={
                                                                    filterOption.value
                                                                }
                                                            />
                                                        </List.ItemButton>
                                                    </List.Item>
                                                );
                                            })}
                                        </StyledNestedFilterList>
                                    </Collapse>
                                    <Divider />
                                </StyledFilter>
                            );
                        })}
                        {/* </StyledFilterContainer> */}
                    </StyledFilterList>
                </StyledFitler>

                <StyledContent>
                    {databases.length ? (
                        <Grid container spacing={3}>
                            {databases.map((db) => {
                                return (
                                    <Grid
                                        key={db.database_id}
                                        item
                                        sm={view === 'list' ? 12 : 12}
                                        md={view === 'list' ? 12 : 6}
                                        lg={view === 'list' ? 12 : 4}
                                        xl={view === 'list' ? 12 : 3}
                                    >
                                        {view === 'list' ? (
                                            <DatabaseLandscapeCard
                                                name={formatDBName(db.app_name)}
                                                id={db.app_id}
                                                image={defaultDBImage}
                                                tag={db.tag}
                                                owner={db.database_created_by}
                                                description={db.description}
                                                votes={db.upvotes}
                                                views={db.views}
                                                trending={db.trending}
                                                isGlobal={db.database_global}
                                                isUpvoted={db.hasVoted}
                                                isFavorite={isFavorited(
                                                    db.database_id,
                                                )}
                                                favorite={() => {
                                                    favoriteDb(db);
                                                }}
                                                onClick={() => {
                                                    navigate(
                                                        `/database/${db.app_id}`,
                                                    );
                                                }}
                                                global={() => {
                                                    setGlobal(db);
                                                }}
                                            />
                                        ) : (
                                            <DatabaseTileCard
                                                name={formatDBName(db.app_name)}
                                                id={db.app_id}
                                                image={defaultDBImage}
                                                tag={db.tag}
                                                owner={db.database_created_by}
                                                description={db.description}
                                                votes={db.upvotes}
                                                views={db.views}
                                                trending={db.trending}
                                                isGlobal={db.database_global}
                                                isUpvoted={db.hasVoted}
                                                isFavorite={isFavorited(
                                                    db.database_id,
                                                )}
                                                favorite={() => {
                                                    favoriteDb(db);
                                                }}
                                                onClick={() => {
                                                    navigate(
                                                        `/database/${db.app_id}`,
                                                    );
                                                }}
                                                global={() => {
                                                    setGlobal(db);
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
});
