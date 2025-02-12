import { useEffect, useState, useRef, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

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
} from '@semoss/ui';

import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { TeamTileCard } from './GenericTeamCard';
import { AddTeamModal } from '@/components/teams/AddTeamModal';
import { Add } from '@mui/icons-material';

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
    width: 'auto',
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

export const TeamsSettingsPage = observer(() => {
    const { adminMode } = useSettings();
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();

    const [addModal, setAddModal] = useState(false);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { teams } = state;

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
                teams.filter((d) =>
                    d.id.toLowerCase().includes(search.toLowerCase()),
                ),
            );
        },
        [teams, search],
        150,
    );

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
                <Grid container spacing={3}>
                    {filteredTeams.length
                        ? filteredTeams.map((team, i) => {
                              return (
                                  <Grid
                                      item
                                      key={i}
                                      sm={12}
                                      md={6}
                                      lg={4}
                                      xl={3}
                                  >
                                      <TeamTileCard
                                          id={team.id}
                                          type={team.type}
                                          description={team.description}
                                          dispatch={dispatch}
                                          teams={teams}
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
                                  </Grid>
                              );
                          })
                        : null}
                </Grid>

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
