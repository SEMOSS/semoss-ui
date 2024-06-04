import { useEffect, useState, useRef, useReducer, useCallback } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import { useNavigate } from 'react-router-dom';

import {
    Grid,
    Search,
    styled,
    Backdrop,
    CircularProgress,
    Stack,
    Typography,
    Modal,
    Box,
    Button,
    useNotification,
    Checkbox,
    Select,
} from '@semoss/ui';

import { removeUnderscores } from '@/utility';

import { Controller, useForm } from 'react-hook-form';
import { TextField } from '@mui/material';
import { TeamTileCard } from './GenericTeamCard';
import { toJS } from 'mobx';

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
    databases: [],
};

const StyledSearchbarDiv = styled('div')({
    display: 'flex',
    gap: '4px',
});

const StyledAddButton = styled(Button)({
    width: '150px',
    borderRadius: '12px',
});

const StyledFormLabel = styled(Typography)({
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '28px',
    letter: '0.15px',
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

type NewTeamForm = {
    TEAM_NAME: string;
    TEAM_DESCRIPTION: string;
    TEAM_TYPE: string;
    CUSTOM_GROUP: boolean;
};

export const TeamsSettingsPage = () => {
    const { adminMode } = useSettings();
    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();

    const [addModal, setAddModal] = useState(false);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { databases } = state;

    const notification = useNotification();

    const [search, setSearch] = useState('');

    const { handleSubmit, control, watch, reset, getValues } =
        useForm<NewTeamForm>({
            defaultValues: {
                TEAM_NAME: '',
                TEAM_DESCRIPTION: '',
                TEAM_TYPE: '',
                CUSTOM_GROUP: false,
            },
        });

    const watchCustom = watch('CUSTOM_GROUP');
    const values = getValues();

    // To focus when getting new results
    const searchbarRef = useRef(null);

    // All Engines -------------------------------------
    const getTeams = useAPI(['getTeams', true]);

    // clear value if customGroup is true
    useEffect(() => {
        if (watchCustom) {
            reset({
                ...values,
                TEAM_TYPE: '',
            });
        }
    }, [watchCustom]);

    //** reset dataMode if adminMode is toggled */
    useEffect(() => {
        monolithStore.getTeams(true).then((data) => {
            dispatch({
                type: 'field',
                field: 'databases',
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
                databases.filter((d) =>
                    d.id.toLowerCase().includes(search.toLowerCase()),
                ),
            );
        },
        [databases, search],
        150,
    );

    /**
     * Method that is called to create the team
     */
    const onSubmit = handleSubmit(async (data: NewTeamForm) => {
        try {
            // create the pixel
            if (!state) {
                throw new Error(`State is missing`);
            }

            const isCustom = watchCustom
                ? monolithStore.addTeam(
                      data.TEAM_NAME,
                      data.TEAM_DESCRIPTION,
                      true,
                      data.TEAM_TYPE,
                  )
                : monolithStore.addTeam(
                      data.TEAM_NAME,
                      data.TEAM_DESCRIPTION,
                      false,
                      data.TEAM_TYPE,
                  );

            // create the team
            isCustom.then(() => {
                dispatch({
                    type: 'field',
                    field: 'databases',
                    value: [
                        ...databases,
                        {
                            id: data.TEAM_NAME,
                            type: data.TEAM_TYPE,
                            description: data.TEAM_DESCRIPTION,
                        },
                    ],
                });
                notification.add({
                    color: 'success',
                    message: 'Successfully added group',
                });
            });

            setAddModal(false);
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: e,
            });
        } finally {
            // close the modal
            setAddModal(false);
        }
    });

    const loginTypes = [];
    for (const type in configStore.store.config.loginsAllowed) {
        if (configStore.store.config.loginsAllowed[type]) {
            loginTypes.push(type);
        }
    }

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
                    <Typography variant="caption">Databases</Typography>
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
                            onClick={() => setAddModal(true)}
                        >
                            + Add New
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
                                          databases={databases}
                                          onClick={() => {
                                              navigate(
                                                  `${team.id
                                                      .toLowerCase()
                                                      .replace(/['"]+/g, '')
                                                      .replace(/\s/g, '-')}`,
                                                  {
                                                      state: {
                                                          name: team.id,
                                                          description:
                                                              team.description,
                                                          type: team.type,
                                                      },
                                                  },
                                              );
                                          }}
                                      />
                                  </Grid>
                              );
                          })
                        : null}
                </Grid>
                <Modal open={addModal} fullWidth>
                    <Modal.Title>Create New Team</Modal.Title>
                    <form onSubmit={onSubmit}>
                        <Modal.Content>
                            <Stack direction="column" spacing={2}>
                                <Box>
                                    <StyledFormLabel variant="subtitle1">
                                        Team Name
                                    </StyledFormLabel>
                                    <Controller
                                        name={'TEAM_NAME'}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label=""
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                />
                                            );
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <StyledFormLabel variant="subtitle1">
                                        Type
                                    </StyledFormLabel>
                                    <Controller
                                        name={'TEAM_TYPE'}
                                        control={control}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <Select
                                                    label=""
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    disabled={watchCustom}
                                                >
                                                    {loginTypes &&
                                                        loginTypes.map(
                                                            (val, idx) => {
                                                                return (
                                                                    <Select.Item
                                                                        key={
                                                                            idx
                                                                        }
                                                                        value={
                                                                            val
                                                                        }
                                                                    >
                                                                        {val}
                                                                    </Select.Item>
                                                                );
                                                            },
                                                        )}
                                                </Select>
                                            );
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <StyledFormLabel variant="subtitle1">
                                        Team Description
                                    </StyledFormLabel>
                                    <Controller
                                        name={'TEAM_DESCRIPTION'}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label=""
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                />
                                            );
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <StyledFormLabel variant="subtitle1">
                                        Custom Group?
                                    </StyledFormLabel>
                                    <Controller
                                        name={'CUSTOM_GROUP'}
                                        control={control}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <Checkbox
                                                    label=""
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                />
                                            );
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Modal.Content>
                        <Modal.Actions>
                            <Stack
                                direction="row"
                                spacing={1}
                                paddingX={2}
                                paddingBottom={2}
                            >
                                <Button
                                    type="button"
                                    onClick={() => setAddModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant={'contained'}>
                                    Save
                                </Button>
                            </Stack>
                        </Modal.Actions>
                    </form>
                </Modal>
            </StyledContainer>
        </>
    );
};
