import { useEffect, useState, useRef, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Add, ExpandMore, ArrowForward, ArrowBack } from '@mui/icons-material';
import {
    Grid,
    Search,
    styled,
    Backdrop,
    CircularProgress,
    Stack,
    Typography,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItemTwo,
} from '@semoss/ui';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { TeamTileCard } from '@/components/teams/TeamTileCard';
import { AddTeamModal } from '@/components/teams/AddTeamModal';

export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

export interface Database {
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
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
});

const StyledSearchbarContainer = styled('div')({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '24px',
});

const StyledSearchbar = styled(Search)({
    width: '80%',
});

const StyledBackdrop = styled(Backdrop)({
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 1501,
});

const initialState = {
    favoritedDbs: [],
    teams: [],
};

const StyledSearchbarDiv = styled('div')({
    display: 'flex',
    gap: '16px',
});

const StyledAddButton = styled(Button)({
    width: '150px',
    borderRadius: '12px',
});

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

const StyledGrid = styled('div')({
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
});

export const TeamsSettingsPage = observer(() => {
    const { adminMode } = useSettings();
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();

    const [addModal, setAddModal] = useState(false);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { teams } = state;
    const [anchorEl, setAnchorEl] = useState(null);

    const [search, setSearch] = useState('');

    // To focus when getting new results
    const searchbarRef = useRef(null);

    // All Teams -------------------------------------
    const getTeams = useAPI(['getTeams', true]);

    /*
     **/
    useEffect(() => {
        monolithStore.getTeams(true).then((data) => {
            dispatch({
                type: 'field',
                field: 'teams',
                value: data,
            });
        });
    }, [adminMode, search]);

    function useDebounce(effect, dependencies, delay) {
        const callback = useCallback(effect, dependencies);

        useEffect(() => {
            const timeout = setTimeout(callback, delay);
            return () => clearTimeout(timeout);
        }, [callback, delay]);
    }

    // DeBounce Function
    useDebounce(
        () => {
            setFilteredTeams(
                teams
                    .filter((d) =>
                        d.id.toLowerCase().includes(search.toLowerCase()),
                    )
                    .sort((a, b) => a.id.localeCompare(b.id)),
            );
        },
        [teams, search],
        150,
    );

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleSort = (order) => {
        const sorted = [...filteredTeams].sort((a, b) => {
            if (order === 'asc') {
                return a.id.localeCompare(b.id);
            } else {
                return b.id.localeCompare(a.id);
            }
        });
        setFilteredTeams(sorted);
        handleMenuClose();
    };

    const isAsc = () => {
        const sorted = [...filteredTeams].sort((a, b) => {
            return a.id.localeCompare(b.id);
        });
        return JSON.stringify(filteredTeams) === JSON.stringify(sorted);
    };

    const isDesc = () => {
        const sorted = [...filteredTeams].sort((a, b) => {
            return b.id.localeCompare(a.id);
        });
        return JSON.stringify(filteredTeams) === JSON.stringify(sorted);
    };

    return (
        <>
            <StyledBackdrop open={getTeams.status !== 'SUCCESS'}>
                <Stack
                    direction={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    spacing={1}
                >
                    <CircularProgress />
                    <Typography variant="body2">Loading</Typography>
                    <Typography variant="caption">Teams</Typography>
                </Stack>
            </StyledBackdrop>
            <StyledContainer>
                <StyledSearchbarContainer>
                    <Box>
                        <Typography variant="h5">Teams</Typography>
                    </Box>
                    <StyledSearchbarDiv>
                        <StyledSearchbar
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            size="small"
                            ref={searchbarRef}
                        />
                        <StyledAddButton
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setAddModal(true)}
                        >
                            Add New
                        </StyledAddButton>
                    </StyledSearchbarDiv>
                </StyledSearchbarContainer>
                {/* <Grid container spacing={3}> */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        width: '100%',
                    }}
                >
                    <IconButton onClick={handleMenuClick}>
                        <Typography
                            sx={{ color: '#212121', borderRadius: '0px' }}
                            variant="body2"
                        >
                            Sort By
                        </Typography>
                        <ExpandMore />
                    </IconButton>
                </div>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItemTwo
                        onClick={() => handleSort('asc')}
                        sx={{
                            backgroundColor: isAsc() ? '#EBF3F8' : 'inherit',
                        }}
                    >
                        A<ArrowForward fontSize="small" />Z
                    </MenuItemTwo>
                    <MenuItemTwo
                        onClick={() => handleSort('desc')}
                        sx={{
                            backgroundColor: isDesc() ? '#EBF3F8' : 'inherit',
                        }}
                    >
                        Z<ArrowBack fontSize="small" />A
                    </MenuItemTwo>
                </Menu>
                {/* <Grid container spacing={3}>  */}
                <StyledGrid>
                    {filteredTeams.length
                        ? filteredTeams.map((team, i) => {
                              return (
                                  <div
                                  //   item
                                  //   key={i}
                                  //   sm={12}
                                  //   md={6}
                                  //   lg={4}
                                  //   xl={3}
                                  >
                                      <TeamTileCard
                                          id={team.id}
                                          type={team.type}
                                          description={team.description}
                                          dispatch={dispatch}
                                          teams={teams}
                                          isCustomGroup={team.is_custom_group}
                                          onClick={() => {
                                              navigate(
                                                  `${team.id
                                                      .toLowerCase()
                                                      .replace(/['"]+/g, '')
                                                      .replace(/\s/g, '-')}`,
                                                  {
                                                      state: {
                                                          name: team.id,
                                                          type: team.type,
                                                      },
                                                  },
                                              );
                                              //   navigate(
                                              //       `${team.id
                                              //           .toLowerCase()
                                              //           .replace(/['"]+/g, '')
                                              //           .replace(/\s/g, '-')}${
                                              //           team.type
                                              //               ? `?type=${team.type}`
                                              //               : ''
                                              //       }`,
                                              //   );
                                          }}
                                      />
                                  </div>
                              );
                          })
                        : null}
                </StyledGrid>

                <AddTeamModal
                    open={addModal}
                    onClose={(team) => {
                        if (team) {
                            const obj = {
                                id: team.id,
                                description: team.description,
                            };

                            if (team.type != 'Custom') {
                                obj['type'] = team.type;
                            }

                            dispatch({
                                type: 'field',
                                field: 'teams',
                                value: [...teams, obj],
                            });
                        }
                        setAddModal(false);
                    }}
                />
            </StyledContainer>
        </>
    );
});
