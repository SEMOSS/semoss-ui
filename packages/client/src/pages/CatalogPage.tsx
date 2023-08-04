import { useEffect, useState, useReducer } from 'react';
import { observer } from 'mobx-react-lite';
import {
    AlertTitle,
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
    TextField,
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

import { formatName } from '@/utils';
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

const StyledFilter = styled('div')(({ theme }) => ({}));

const StyledNestedFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    marginRight: theme.spacing(2),
}));

const StyledAvatarCount = styled(Avatar)(({ theme }) => ({
    width: '32px',
    height: '32px',
    color: theme.palette.text.primary,
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1',
}));

const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if the chip is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    color: selected
        ? theme.palette.semossBlue['900']
        : theme.palette.semossBlue['900'],
    backgroundColor: selected
        ? theme.palette.semossBlue['100']
        : theme.palette.semossBlue['50'],

    '&:hover': {
        color: theme.palette.semossBlue['50'],
    },
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
 * Landing page to view the available engines
 */
export const CatalogPage = observer((): JSX.Element => {
    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const { search: catalogParams } = useLocation();

    /** This page is shared by db, storage, model */
    let catalogType = '';

    switch (catalogParams) {
        case '':
            catalogType = 'Database';
            break;
        case '?type=database':
            catalogType = 'Database';
            break;
        case '?type=model':
            catalogType = 'Model';
            break;
        case '?type=storage':
            catalogType = 'Storage';
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
    const [filterByVisibility, setFilterByVisibility] = useState(true);

    const dbPixelPrefix: string =
        mode === 'My Databases' ? `MyEngines` : 'MyDiscoverableEngines';

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
    )}, filterWord=["${search}"], onlyFavorites=[true], engineTypes=['${catalogType.toUpperCase()}']);
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
        )} ] , filterWord=["${search}"], userT = [true], engineTypes=['${catalogType.toUpperCase()}']) ;`,
    );

    const getCatalogFilters = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(
        metaKeys.length > 0
            ? `GetEngineMetaValues( engineTypes=['${catalogType.toUpperCase()}'], metaKeys = ${JSON.stringify(
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
     * @name upvoteDb
     * @param db
     */
    const upvoteDb = (db) => {
        let pixelString = '';

        if (!db.hasVoted) {
            pixelString += `VoteDatabase(database="${db.database_id}", vote=1)`;
        } else {
            pixelString += `UnvoteDatabase(database="${db.database_id}")`;
        }

        monolithStore.runQuery(pixelString).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const pixelResponse = response.pixelReturn[0].output;

            if (type.indexOf('ERROR') === -1) {
                const newDatabases = [];

                databases.forEach((database) => {
                    if (database.database_id === db.database_id) {
                        const newCopy = database;
                        newCopy.upvotes = !db.hasVoted
                            ? newCopy.upvotes + 1
                            : newCopy.upvotes - 1;
                        newCopy.hasVoted = !db.hasVoted ? true : false;

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
                <Stack>
                    <div style={{ height: '16px' }}></div>
                    <StyledStack
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
                                {catalogType === 'Database'
                                    ? 'Data'
                                    : catalogType === 'Storage'
                                    ? 'Storage'
                                    : 'Model'}{' '}
                                Catalog
                            </Typography>
                            <Search
                                size={'small'}
                                label={'Search'}
                                onChange={(e) => {
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
                                size={'lg'}
                                variant={'contained'}
                                onClick={() => {
                                    navigate('/import');
                                }}
                            >
                                Add {catalogType}
                            </Button>

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
                </Stack>
            }
        >
            <StyledContainer
            // sx={{ border: 'solid red' }}
            >
                <StyledFitler
                // style={{ border: 'solid green' }}
                >
                    {/* <StyledFilterList dense={true}>
                        <List.Item>
                            <List.ItemButton
                                sx={{ borderRadius: 8 }}
                                selected={catalogType === 'database'}
                                onClick={() => {
                                    navigate(`/catalog?type=database`);
                                }}
                            >
                                <List.Icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M8 0C3.58 0 0 1.79 0 4V14C0 16.21 3.59 18 8 18C12.41 18 16 16.21 16 14V4C16 1.79 12.42 0 8 0ZM14 14C14 14.5 11.87 16 8 16C4.13 16 2 14.5 2 14V11.77C3.61 12.55 5.72 13 8 13C10.28 13 12.39 12.55 14 11.77V14ZM14 9.45C12.7 10.4 10.42 11 8 11C5.58 11 3.3 10.4 2 9.45V6.64C3.47 7.47 5.61 8 8 8C10.39 8 12.53 7.47 14 6.64V9.45ZM8 6C4.13 6 2 4.5 2 4C2 3.5 4.13 2 8 2C11.87 2 14 3.5 14 4C14 4.5 11.87 6 8 6Z"
                                            fill="#5C5C5C"
                                        />
                                    </svg>
                                </List.Icon>
                                <List.ItemText primary={'Data Catalog'} />
                            </List.ItemButton>
                        </List.Item>
                        <List.Item>
                            <List.ItemButton
                                sx={{ borderRadius: 8 }}
                                disabled={true}
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
                                sx={
                                    {
                                        // borderRadius: 4
                                    }
                                }
                                disabled={true}
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
                    </StyledFilterList> */}

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
                                    <Typography variant="body1">
                                        Filter By
                                    </Typography>
                                }
                            />
                        </List.Item>

                        <Collapse in={filterByVisibility}>
                            {catalogType.toUpperCase() === 'DATABASE' && (
                                <StyledChipList>
                                    <StyledChip
                                        label={'My Databases'}
                                        selected={mode === 'My Databases'}
                                        // variant="filled"
                                        // variantColor={
                                        //     mode === 'My Databases'
                                        //         ? 'primary'
                                        //         : 'lcprimary'
                                        // }
                                        onClick={() => setMode('My Databases')}
                                    ></StyledChip>
                                    <StyledChip
                                        label={'Discoverable Databases'}
                                        selected={
                                            mode === 'Discoverable Databases'
                                        }
                                        // variantColor={
                                        //     mode === 'Discoverable Databases'
                                        //         ? 'primary'
                                        //         : 'lcprimary'
                                        // }
                                        onClick={() => {
                                            setMode('Discoverable Databases');
                                        }}
                                    ></StyledChip>
                                </StyledChipList>
                            )}

                            {Object.entries(filterOptions).map((entries, i) => {
                                const totalFilters =
                                    Object.entries(filterOptions).length;
                                const list = entries[1];
                                let shownListItems = 0; // for show more functionality
                                return (
                                    <StyledFilter key={i}>
                                        <List.Item>
                                            <List.ItemText
                                                disableTypography
                                                primary={
                                                    <Typography
                                                        variant={'body1'}
                                                        sx={{ fontWeight: 500 }}
                                                    >
                                                        {formatDBName(
                                                            entries[0],
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                        </List.Item>
                                        <List.Item>
                                            <TextField
                                                label={'Search'}
                                                size={'small'}
                                                sx={{
                                                    width: '100%',
                                                }}
                                                onChange={(e) => {
                                                    const visibleFilters = {
                                                        ...filterVisibility,
                                                    };
                                                    visibleFilters[entries[0]] =
                                                        {
                                                            open: visibleFilters[
                                                                entries[0]
                                                            ].open,
                                                            value: visibleFilters[
                                                                entries[0]
                                                            ].value,
                                                            search: e.target
                                                                .value,
                                                        };
                                                    setFilterVisibility(
                                                        visibleFilters,
                                                    );
                                                }}
                                            />
                                        </List.Item>
                                        <StyledNestedFilterList dense={true}>
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
                                                                filterVisibility[
                                                                    entries[0]
                                                                ].search.toLowerCase(),
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
                                                                        ) > -1
                                                                    }
                                                                    onClick={() => {
                                                                        setSelectedFilters(
                                                                            entries[0],
                                                                            filterOption,
                                                                        );
                                                                    }}
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
                                                    <Button
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
                                                        Show{' '}
                                                        {filterVisibility[
                                                            entries[0]
                                                        ].open
                                                            ? 'Less'
                                                            : 'More'}
                                                    </Button>
                                                </List.Item>
                                            )}
                                        </StyledNestedFilterList>
                                        {i + 1 !== totalFilters && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    paddingLeft: '16px',
                                                    paddingRight: '16px',
                                                }}
                                            >
                                                <Divider></Divider>
                                            </div>
                                        )}
                                    </StyledFilter>
                                );
                            })}
                        </Collapse>
                    </StyledFilterList>
                </StyledFitler>

                <StyledContent
                // style={{ border: 'solid yellow' }}
                >
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
                                                onClick={() => {
                                                    navigate(
                                                        `/${catalogType.toLowerCase()}/${
                                                            db.app_id
                                                        }`,
                                                    );
                                                }}
                                                favorite={() => {
                                                    favoriteDb(db);
                                                }}
                                                global={() => {
                                                    setGlobal(db);
                                                }}
                                                upvote={(val) => {
                                                    upvoteDb(db);
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
                                                        `/${catalogType.toLowerCase()}/${
                                                            db.app_id
                                                        }`,
                                                    );
                                                }}
                                                global={() => {
                                                    setGlobal(db);
                                                }}
                                                upvote={(val) => {
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
});
