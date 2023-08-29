import { useEffect, useState, useRef, useReducer } from 'react';
import { useRootStore, usePixel, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { useNavigate } from 'react-router-dom';

import {
    Grid,
    Search,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    styled,
} from '@semoss/ui';

import {
    SpaceDashboardOutlined,
    FormatListBulletedOutlined,
} from '@mui/icons-material';

import { EngineLandscapeCard, EngineTileCard } from '@/components/engine';

import { formatName } from '@/utils';

export interface MDMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

export interface Model {
    app_cost: string;
    app_favorite: number;
    app_id: string;
    app_name: string;
    app_type: string;
    database_cost: string;
    database_id: string;
    database_name: string;
    database_type: string;
    low_database_name: string;
    database_global: true;
    database_favorite?: number;
    permission?: number;
    user_permission?: number;
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
    width: '20%',
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

export const ModelSettingsPage = () => {
    const { adminMode } = useSettings();
    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { favoritedDbs, databases } = state;

    const [view, setView] = useState('tile');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Name');
    const [canCollect, setCanCollect] = useState(true);
    const [offset, setOffset] = useState(0);

    const [selectedApp, setSelectedApp] = useState<Model>(null);

    //** amount of items to be loaded */
    const limit = 15;

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
    MyEngines(metaKeys = ${JSON.stringify(
        metaKeys,
    )}, filterWord=["${search}"], onlyFavorites=[true], engineTypes=['MODEL']);
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

    // All Engines -------------------------------------
    const getEngines = useAPI([
        'getEngines',
        adminMode,
        search,
        'MODEL',
        offset,
        limit,
    ]);

    //** reset dataMode if adminMode is toggled */
    useEffect(() => {
        setOffset(0);
        dispatch({
            type: 'field',
            field: 'databases',
            value: [],
        });
    }, [adminMode]);

    //** append data through infinite scroll */
    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const mutateListWithVotes = databases;

        getEngines.data.forEach((db, i) => {
            mutateListWithVotes.push({
                ...db,
                upvotes: db.upvotes ? db.upvotes : 0,
                // hasUpvoted: false,
                views: 'N/A',
                trending: 'N/A',
            });
        });

        dispatch({
            type: 'field',
            field: 'databases',
            value: mutateListWithVotes,
        });

        setSelectedApp(null);
        searchbarRef.current?.focus();
    }, [getEngines.status, getEngines.data]);

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

        if (!db.hasUpvoted) {
            pixelString += `VoteEngine(engine="${db.database_id}", vote=1)`;
        } else {
            pixelString += `UnvoteEngine(engine="${db.database_id}")`;
        }

        monolithStore.runQuery(pixelString).then((response) => {
            const type = response.pixelReturn[0].operationType;
            // const pixelResponse = response.pixelReturn[0].output;

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
                console.error('Error voting for Model');
            }
        });
    };

    /**
     * @name setDbGlobal
     * @param db
     */
    const setDbGlobal = (db) => {
        monolithStore
            .setEngineGlobal(adminMode, db.database_id, !db.database_global)
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

    //** infinite sroll variables */
    let scrollEle, scrollTimeout, currentScroll, previousScroll;
    const offsetRef = useRef(0);
    offsetRef.current = offset;
    const canCollectRef = useRef(true);
    canCollectRef.current = canCollect;

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
     * @desc infinite scroll
     */
    useEffect(() => {
        scrollEle = document.querySelector('#home__content');

        scrollEle.addEventListener('scroll', scrollAll);
        return () => {
            scrollEle.removeEventListener('scroll', scrollAll);
        };
    }, [scrollEle]);

    return (
        <StyledContainer>
            <StyledSearchbarContainer>
                <StyledSearchbar
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                    label="Model"
                    size="small"
                    // enableEndAdornment={true}
                    // ref={searchbarRef}
                />
                <StyledSort
                    size={'small'}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <MenuItem value="Name">Name</MenuItem>
                    <MenuItem value="Date Created">Date Created</MenuItem>
                    <MenuItem value="Views">Views</MenuItem>
                    <MenuItem value="Trending">Trending</MenuItem>
                    <MenuItem value="Upvotes">Upvotes</MenuItem>
                </StyledSort>

                <ToggleButtonGroup size={'small'} value={view}>
                    <ToggleButton onClick={(e, v) => setView(v)} value={'tile'}>
                        <SpaceDashboardOutlined />
                    </ToggleButton>
                    <ToggleButton onClick={(e, v) => setView(v)} value={'list'}>
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
                                      <EngineLandscapeCard
                                          name={db.app_name}
                                          id={db.app_id}
                                          tag={db.tag}
                                          owner={db.database_created_by}
                                          description={db.description}
                                          votes={db.upvotes}
                                          views={db.views}
                                          trending={db.trending}
                                          isGlobal={db.database_global}
                                          isUpvoted={db.hasUpvoted}
                                          isFavorite={isFavorited(
                                              db.database_id,
                                          )}
                                          favorite={() => {
                                              favoriteDb(db);
                                          }}
                                          onClick={() => {
                                              navigate(`${db.app_id}`, {
                                                  state: {
                                                      name: formatName(
                                                          db.database_name,
                                                      ),
                                                      global: db.database_global,
                                                      permission: db.permission,
                                                  },
                                              });
                                          }}
                                          upvote={() => {
                                              upvoteDb(db);
                                          }}
                                          global={() => {
                                              setDbGlobal(db);
                                          }}
                                      />
                                  ) : (
                                      <EngineTileCard
                                          name={db.app_name}
                                          id={db.app_id}
                                          tag={db.tag}
                                          owner={db.database_created_by}
                                          description={db.description}
                                          votes={db.upvotes}
                                          views={db.views}
                                          trending={db.trending}
                                          isGlobal={db.database_global}
                                          isFavorite={isFavorited(
                                              db.database_id,
                                          )}
                                          isUpvoted={db.hasUpvoted}
                                          favorite={() => {
                                              favoriteDb(db);
                                          }}
                                          onClick={() => {
                                              navigate(`${db.app_id}`, {
                                                  state: {
                                                      name: formatName(
                                                          db.database_name,
                                                      ),
                                                      global: db.database_global,
                                                      permission: db.permission,
                                                  },
                                              });
                                          }}
                                          upvote={() => {
                                              upvoteDb(db);
                                          }}
                                          global={() => {
                                              setDbGlobal(db);
                                          }}
                                      />
                                  )}
                              </Grid>
                          );
                      })
                    : 'No models to choose from'}
            </Grid>
        </StyledContainer>
    );
};
