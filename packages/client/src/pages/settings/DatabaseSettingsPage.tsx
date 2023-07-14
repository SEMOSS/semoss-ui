import { useEffect, useState, useRef, useReducer } from 'react';
import { useRootStore, usePixel } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { LoadingScreen } from '@/components/ui';
import { MonolithStore } from '@/stores/monolith';

import {
    Grid,
    Search,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    styled,
} from '@semoss/ui';

import {
    SpaceDashboardOutlined,
    FormatListBulletedOutlined,
} from '@mui/icons-material';

import {
    DatabaseLandscapeCard,
    DatabaseTileCard,
    Permissions,
} from '@/components/database';

import defaultDBImage from '../../assets/img/placeholder.png';
export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

const StyledContainer = styled('div')({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
});

const StyledSearchbarContainer = styled('div')({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: '24px',
});

const StyledSearchbar = styled(Search)({
    width: '80%',
});

const StyledSort = styled(Select)({
    display: 'flex',
    width: '220px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '3px',
    flexShrink: '0',
});

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

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();
    const { configStore, monolithStore } = useRootStore();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { favoritedDbs, databases } = state;

    const [view, setView] = useState('tile');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Name');

    const [selectedApp, setSelectedApp] =
        useState<Awaited<ReturnType<MonolithStore['getDatabases']>>[number]>(
            null,
        );

    // To focus when getting new results
    const searchbarRef = useRef(null);

    // get a list of the keys
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead' ||
                k.display_options === 'textarea'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = databaseMetaKeys.map((k) => {
        return k.metakey;
    });

    const getFavoritedDatabases = usePixel(`
    MyDatabases(metaKeys = ${JSON.stringify(
        metaKeys,
    )}, filterWord=["${search}"], onlyFavorites=[true]);
    `);

    useEffect(() => {
        if (getFavoritedDatabases.status !== 'SUCCESS') {
            return;
        }

        dispatch({
            type: 'field',
            field: 'favoritedDbs',
            value: getFavoritedDatabases.data,
        });

        searchbarRef.current?.focus();
    }, [getFavoritedDatabases.status, getFavoritedDatabases.data]);

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
            description: string;
            low_database_name: string;
            permission: number;
            tag: string;
            user_permission: number;
        }[]
    >(`
        MyDatabases(metaKeys = ${JSON.stringify(
            metaKeys,
        )}, filterWord=["${search}"], userT=[true]);
    `);

    /**
     * @desc handles response for getDatabases
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
                owner: 'N/A',
            });
        });

        dispatch({
            type: 'field',
            field: 'databases',
            value: mutateListWithVotes,
        });

        setSelectedApp(null);
        searchbarRef.current?.focus();
    }, [getDatabases.status, getDatabases.data]);

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
     * @name setDbGlobal
     * @param db
     */
    const setDbGlobal = (db) => {
        monolithStore
            .setDatabaseGlobal(adminMode, db.database_id, !db.database_global)
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

    return (
        <StyledContainer>
            {!selectedApp ? (
                <>
                    <Typography variant={'body1'}>
                        Select a database to start
                    </Typography>

                    <StyledSearchbarContainer>
                        <StyledSearchbar
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            label="Database"
                            size="small"
                            enableEndAdornment={true}
                            ref={searchbarRef}
                        />
                        <StyledSort
                            size={'small'}
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <MenuItem value="Name">Name</MenuItem>
                            <MenuItem value="Date Created">
                                Date Created
                            </MenuItem>
                            <MenuItem value="Views">Views</MenuItem>
                            <MenuItem value="Trending">Trending</MenuItem>
                            <MenuItem value="Upvotes">Upvotes</MenuItem>
                        </StyledSort>

                        <ToggleButtonGroup size={'small'} value={view}>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'tile'}
                            >
                                <SpaceDashboardOutlined />
                            </ToggleButton>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'list'}
                            >
                                <FormatListBulletedOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </StyledSearchbarContainer>
                    <Grid container spacing={3}>
                        {databases.length
                            ? databases.map((db, i) => {
                                  return (
                                      <Grid
                                          item
                                          key={i}
                                          sm={view === 'list' ? 12 : 12}
                                          md={view === 'list' ? 12 : 6}
                                          lg={view === 'list' ? 12 : 4}
                                          xl={view === 'list' ? 12 : 3}
                                      >
                                          {view === 'list' ? (
                                              <DatabaseLandscapeCard
                                                  name={formatDBName(
                                                      db.app_name,
                                                  )}
                                                  id={db.app_id}
                                                  image={defaultDBImage}
                                                  tag={db.tag}
                                                  owner={db.owner}
                                                  description={db.description}
                                                  votes={db.upvotes}
                                                  views={db.views}
                                                  trending={db.trending}
                                                  isGlobal={db.database_global}
                                                  isUpvoted={db.hasVoted}
                                                  isFavorite={isFavorited(
                                                      db.database_id,
                                                  )}
                                                  favorite={(val) => {
                                                      favoriteDb(db);
                                                  }}
                                                  onClick={(id) =>
                                                      setSelectedApp(db)
                                                  }
                                                  upvote={(val) => {
                                                      upvoteDb(db);
                                                  }}
                                                  global={(val) => {
                                                      setDbGlobal(db);
                                                  }}
                                              />
                                          ) : (
                                              <DatabaseTileCard
                                                  name={formatDBName(
                                                      db.app_name,
                                                  )}
                                                  id={db.app_id}
                                                  image={defaultDBImage}
                                                  tag={db.tag}
                                                  owner={db.owner}
                                                  description={db.description}
                                                  votes={db.upvotes}
                                                  views={db.views}
                                                  trending={db.trending}
                                                  isGlobal={db.database_global}
                                                  isFavorite={isFavorited(
                                                      db.database_id,
                                                  )}
                                                  isUpvoted={db.hasVoted}
                                                  favorite={(val) => {
                                                      favoriteDb(db);
                                                  }}
                                                  onClick={(id) =>
                                                      setSelectedApp(db)
                                                  }
                                                  upvote={(val) => {
                                                      upvoteDb(db);
                                                  }}
                                                  global={(val) => {
                                                      setDbGlobal(db);
                                                  }}
                                              />
                                          )}
                                      </Grid>
                                  );
                              })
                            : 'No databases to choose from'}
                    </Grid>
                </>
            ) : (
                <Permissions
                    config={{
                        id: selectedApp.database_id,
                        name: selectedApp.database_name,
                        global: selectedApp.database_global,
                        visibility: selectedApp.database_visibility,
                    }}
                ></Permissions>
            )}
        </StyledContainer>
    );
};
