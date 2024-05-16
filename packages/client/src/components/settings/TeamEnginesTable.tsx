import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
    styled,
    Button,
    Checkbox,
    Table,
    IconButton,
    Modal,
    Typography,
    Autocomplete,
    Card,
    Box,
    Chip,
    Avatar,
    Search,
    Stack,
    useNotification,
    RadioGroup,
    Icon,
} from '@semoss/ui';
import {
    Delete,
    ClearRounded,
    EditRounded,
    RemoveRedEyeRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { SETTINGS_ROLE } from './settings.types';
import { useRootStore } from '@/hooks';

const colors = [
    '#22A4FF',
    '#FA3F20',
    '#FA3F20',
    '#FF9800',
    '#FF9800',
    '#22A4FF',
    '#4CAF50',
];

const UserInfoTableCell = styled(Table.Cell)({
    display: 'flex',
    alignItems: 'center',
    height: '84px',
});

const NameIDWrapper = styled('div')({
    display: 'inline-block',
});

const StyledEngineContent = styled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '25px',
    flexShrink: '0',
});

const StyledEngineInnerContent = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    alignSelf: 'stretch',
});

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledEngineTable = styled(Table)({ backgroundColor: 'white' });

const StyledTableTitleContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
    backgroundColor: 'white',
});

const StyledTableTitleDiv = styled('div')({
    display: 'flex',
    padding: '12px 24px 12px 16px',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleEngineContainer = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledTableTitleEngineCountContainer = styled('div')({
    display: 'flex',
    height: '56px',
    padding: '6px 16px 6px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleEngineCount = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSearchButtonContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    // gap: '10px',
});

const StyledDeleteSelectedContainer = styled('div')({
    display: 'flex',
    padding: '10px 8px 10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledAddEnginesContainer = styled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledNonEnginesContainer = styled('div')({
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledNonEnginesDiv = styled('div')({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
});

const StyledTableCell = styled(Table.Cell)({
    paddingLeft: '16px',
});

const StyledCheckbox = styled(Checkbox)({
    paddingBottom: '0px',
});

const StyledModalContentText = styled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

// maps for permissions,
const permissionMapper = {
    Author: 1, // BE: 'DISPLAY'
    Editor: 2, // BE: 'DISPLAY'
    'Read-Only': 3, // DISPLAY: BE
};

interface EnginesTableProps {
    /**
     * Id of the setting
     */
    groupId: string;

    /**
     * group type
     */
    groupType: string;

    name: string;
}

export const TeamEnginesTable = (props: EnginesTableProps) => {
    const { groupId, groupType } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    /** Engine Table State */
    const [enginesPage, setEnginesPage] = useState<number>(1);
    const [selectedEngines, setSelectedEngines] = useState([]);
    const [count, setCount] = useState(0);

    /** Delete Engine */
    const [deleteEnginesModal, setDeleteEnginesModal] =
        useState<boolean>(false);
    const [deleteEngineModal, setDeleteEngineModal] = useState<boolean>(false);
    const [engineToDelete, setEngineToDelete] = useState(null);

    /** Add Engine State */
    const [addEngineModal, setAddEngineModal] = useState<boolean>(false);
    const [nonCredentialedEngines, setNonCredentialedEngines] = useState([]);
    const [selectedNonCredentialedEngines, setSelectedNonCredentialedEngines] =
        useState([]);
    const [addEngineRole, setAddEngineRole] = useState<SETTINGS_ROLE>();

    const [engines, setEngines] = useState(null);
    const [enginesCount, setEngineCount] = useState(null);
    const [hasEngines, setHasEngines] = useState(false);

    const limit = 5;

    const engineSearchRef = useRef(undefined);

    const { watch, setValue } = useForm<{
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Filters for engines table
            SEARCH_FILTER: '',
        },
    });

    const searchFilter = watch('SEARCH_FILTER');

    /**
     * @name useEffect
     * @desc - sets engines in react hook form
     */
    useEffect(() => {
        monolithStore
            .getTeamEngines(
                groupId,
                limit,
                enginesPage * limit - limit, // offset
                searchFilter,
            )
            .then((data) => {
                setEngines(data);
                setHasEngines(true);
            });
    }, []);

    /**
     * @name submitNonGroupEngines
     */
    const submitNonGroupEngines = async () => {
        try {
            // construct requests for post data
            const requests = selectedNonCredentialedEngines.map((m) => {
                return {
                    engine_id: m.engine_id,
                    permission: permissionMapper[addEngineRole],
                };
            });

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No engines to add`,
                });

                return;
            }

            for (let i = 0; i < requests.length; i++) {
                let response: AxiosResponse<{ success: boolean }> | null = null;
                response = await monolithStore.addEnginePermission(
                    groupId,
                    requests[i].engine_id,
                    permissionMapper[addEngineRole],
                    groupType ? groupType : '',
                );

                if (!response) {
                    return;
                }

                // ignore if there is no response
                if (response) {
                    setAddEngineModal(false);
                    setSelectedNonCredentialedEngines([]);

                    notification.add({
                        color: 'success',
                        message: 'Successfully added engine permission',
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: `Error adding engine permission`,
                    });
                }
            }
        } catch (e) {
            setAddEngineModal(false);
            setSelectedNonCredentialedEngines([]);

            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the engines
            setCount(count + 1);
        }
    };

    /**
     * @name deleteEngine
     * @param engine
     */
    const deleteEngine = async (engine) => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.deleteEnginePermission(
                groupId,
                engine,
            );

            if (!response) {
                return;
            }

            notification.add({
                color: 'success',
                message: `Successfully removed engine`,
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setDeleteEngineModal(false);
            setCount(count + 1);
        }
        // refresh the engines
    };

    /**
     * @name deleteEnginePermissions
     */
    const deleteEnginePermissions = async () => {
        try {
            for (let i = 0; i < selectedEngines.length; i++) {
                try {
                    let response: AxiosResponse<{ success: boolean }> | null =
                        null;
                    response = await monolithStore.deleteEnginePermission(
                        groupId,
                        selectedEngines[i],
                    );

                    if (!response) {
                        return;
                    }
                } catch (e) {
                    notification.add({
                        color: 'error',
                        message: String(e),
                    });
                } finally {
                    setDeleteEngineModal(false);
                }
            }
        } finally {
            notification.add({
                color: 'success',
                message: `Successfully removed engines`,
            });
            setCount(count + 1);
            setDeleteEnginesModal(false);
            setSelectedEngines([]);
        }
    };

    /**
     * @name getEngines
     * @desc Gets all engines without credentials
     */
    const getEngines = async () => {
        try {
            let response;
            // possibly add more db table columns / keys here to get id type for display under engines
            // eslint-disable-next-line prefer-const
            response = await monolithStore.getUnassignedTeamEngines(groupId);

            // ignore if there is no response
            if (response) {
                const engines = response.map((val) => {
                    return {
                        ...val,
                        color: colors[
                            Math.floor(Math.random() * colors.length)
                        ],
                    };
                });

                setNonCredentialedEngines(engines);
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setAddEngineModal(true);
        }
    };

    /** ENGINES TABLE FUNCTIONS */
    const updateSelectedEngines = async (engine) => {
        try {
            if (!engine.engineid) {
                notification.add({
                    color: 'warning',
                    message: `No permissions to change`,
                });

                return;
            }

            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.editEnginePermission(
                groupId,
                engine,
            );

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully updated permissions',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing permissions`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the members
            // getMembers.refresh();
        }
    };

    const paginationOptions = {
        enginesPageCounts: [5],
    };

    engines > 9 && paginationOptions.enginesPageCounts.push(10);
    engines > 19 && paginationOptions.enginesPageCounts.push(20);

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
            monolithStore
                .getTeamEngines(
                    groupId,
                    limit,
                    enginesPage * limit - limit, // offset
                    searchFilter,
                )
                .then((data) => {
                    setEngines(data);
                    setHasEngines(true);
                });
            monolithStore
                .getTeamEngines(
                    groupId,
                    100,
                    0, // offset
                    searchFilter,
                )
                .then((data) => setEngineCount(data.length));
        },
        [count, enginesPage, searchFilter],
        200,
    );

    return (
        <StyledEngineContent>
            <StyledEngineInnerContent>
                {(engines && engines.length > 0) ||
                enginesCount > 0 ||
                hasEngines ? (
                    <StyledTableContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>Engines</StyledTableTitleDiv>
                            <StyledTableTitleEngineContainer />
                            <StyledSearchButtonContainer>
                                <Search
                                    ref={engineSearchRef}
                                    placeholder="Search Engines"
                                    size="small"
                                    value={searchFilter}
                                    onChange={(e) => {
                                        setValue(
                                            'SEARCH_FILTER',
                                            e.target.value,
                                        );
                                    }}
                                />
                            </StyledSearchButtonContainer>

                            <StyledDeleteSelectedContainer>
                                {selectedEngines.length > 0 && (
                                    <Button
                                        variant={'outlined'}
                                        color="error"
                                        onClick={() =>
                                            setDeleteEnginesModal(true)
                                        }
                                    >
                                        Delete Selected
                                    </Button>
                                )}
                            </StyledDeleteSelectedContainer>
                            <StyledAddEnginesContainer>
                                <Button
                                    variant={'contained'}
                                    onClick={() => {
                                        getEngines();
                                    }}
                                >
                                    Add Engines{' '}
                                </Button>
                            </StyledAddEnginesContainer>
                        </StyledTableTitleContainer>
                        <StyledEngineTable>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell size="small" padding="checkbox">
                                        <Checkbox
                                            checked={
                                                selectedEngines.length ===
                                                    engines.length &&
                                                engines.length > 0
                                            }
                                            onChange={() => {
                                                if (
                                                    selectedEngines.length !==
                                                    engines.length
                                                ) {
                                                    setSelectedEngines(engines);
                                                } else {
                                                    setSelectedEngines([]);
                                                }
                                            }}
                                        />
                                    </Table.Cell>
                                    <Table.Cell size="small">Name</Table.Cell>
                                    <Table.Cell size="small">Access</Table.Cell>
                                    <Table.Cell size="small">
                                        Added Date
                                    </Table.Cell>
                                    <Table.Cell size="small">Action</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {engines &&
                                    engines.map((x, i) => {
                                        const engine = engines[i];

                                        let isSelected = false;

                                        if (engine) {
                                            isSelected = selectedEngines.some(
                                                (value) => {
                                                    return (
                                                        value.engineid ===
                                                        engine.engineid
                                                    );
                                                },
                                            );
                                        }
                                        if (engine) {
                                            return (
                                                <Table.Row
                                                    key={engine.engineid + i}
                                                >
                                                    <StyledTableCell
                                                        size="medium"
                                                        padding="checkbox"
                                                    >
                                                        <StyledCheckbox
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    const selEngines =
                                                                        [];
                                                                    selectedEngines.forEach(
                                                                        (p) => {
                                                                            if (
                                                                                p.engineid !==
                                                                                engine.engineid
                                                                            )
                                                                                selEngines.push(
                                                                                    p,
                                                                                );
                                                                        },
                                                                    );
                                                                    setSelectedEngines(
                                                                        selEngines,
                                                                    );
                                                                } else {
                                                                    setSelectedEngines(
                                                                        [
                                                                            ...selectedEngines,
                                                                            engine,
                                                                        ],
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </StyledTableCell>
                                                    <UserInfoTableCell
                                                        size="medium"
                                                        component="td"
                                                        scope="row"
                                                    >
                                                        <NameIDWrapper>
                                                            <Stack>
                                                                {
                                                                    engine.engine_name
                                                                }
                                                            </Stack>
                                                            <Stack>
                                                                {`Engine ID: ${engine.engineid}`}
                                                            </Stack>
                                                        </NameIDWrapper>
                                                    </UserInfoTableCell>
                                                    <Table.Cell size="medium">
                                                        <RadioGroup
                                                            row
                                                            defaultValue={
                                                                engine.permission
                                                            }
                                                            onChange={(e) => {
                                                                console.log(
                                                                    'Hit Update Permission fn and fix in state',
                                                                );
                                                                updateSelectedEngines(
                                                                    {
                                                                        engineid:
                                                                            engine.engineid,
                                                                        type: engine.type,
                                                                        permission:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <RadioGroup.Item
                                                                value="1"
                                                                label="Author"
                                                            />
                                                            <RadioGroup.Item
                                                                value="2"
                                                                label="Editor"
                                                            />
                                                            <RadioGroup.Item
                                                                value="3"
                                                                label="Read-Only"
                                                            />
                                                        </RadioGroup>
                                                    </Table.Cell>
                                                    <Table.Cell size="medium">
                                                        {
                                                            engine.engine_date_created
                                                        }
                                                    </Table.Cell>
                                                    <Table.Cell size="medium">
                                                        <IconButton
                                                            onClick={() => {
                                                                // set engine
                                                                setEngineToDelete(
                                                                    engine,
                                                                );
                                                                // open modal
                                                                setDeleteEngineModal(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Delete></Delete>
                                                        </IconButton>
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        } else {
                                            return (
                                                <Table.Row
                                                    key={
                                                        i + 'No data available'
                                                    }
                                                >
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                </Table.Row>
                                            );
                                        }
                                    })}
                            </Table.Body>
                            <Table.Footer>
                                <Table.Row>
                                    <Table.Pagination
                                        rowsPerPageOptions={
                                            paginationOptions.enginesPageCounts
                                        }
                                        onPageChange={(e, v) => {
                                            setEnginesPage(v + 1);
                                            setSelectedEngines([]);
                                        }}
                                        page={enginesPage - 1}
                                        rowsPerPage={5}
                                        count={enginesCount}
                                    />
                                </Table.Row>
                            </Table.Footer>
                        </StyledEngineTable>
                    </StyledTableContainer>
                ) : (
                    <StyledNonEnginesContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>engines</Typography>
                            </StyledTableTitleDiv>
                        </StyledTableTitleContainer>
                        <StyledNonEnginesDiv>
                            <Typography variant={'body1'}>
                                No engines present
                            </Typography>
                            <Button
                                variant={'contained'}
                                onClick={() => {
                                    getEngines();
                                }}
                            >
                                Add Engines
                            </Button>
                        </StyledNonEnginesDiv>
                    </StyledNonEnginesContainer>
                )}
            </StyledEngineInnerContent>
            <Modal open={addEngineModal} maxWidth="lg">
                <Modal.Title>Add Engine</Modal.Title>
                <Modal.Content sx={{ width: '50rem' }}>
                    <StyledModalContentText>
                        <Autocomplete
                            label="Select Engine"
                            placeholder="Engine Name"
                            multiple={true}
                            options={nonCredentialedEngines}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${selectedNonCredentialedEngines.length - 2}`
                            }
                            value={[...selectedNonCredentialedEngines]}
                            getOptionLabel={(option: any) => {
                                return `${option.engine_name}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return option.engine_name === value.engine_name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedEngines([
                                    ...newValue,
                                ]);
                            }}
                        />

                        {selectedNonCredentialedEngines &&
                            selectedNonCredentialedEngines.map(
                                (engine, idx) => {
                                    const space =
                                        engine.engine_name.indexOf(' ');
                                    const initial = engine.engine_name
                                        ? space > -1
                                            ? `${engine.engine_name[0].toUpperCase()}${engine.engine_name[
                                                  space + 1
                                              ].toUpperCase()}`
                                            : engine.engine_name[0].toUpperCase()
                                        : engine.engine_id[0].toUpperCase();
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'left',
                                                align: 'center',
                                                backgroundColor:
                                                    idx % 2 !== 0
                                                        ? 'rgba(0, 0, 0, .03)'
                                                        : '',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    marginTop: '6px',
                                                    marginLeft: '8px',
                                                    marginRight: '8px',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        height: '80px',
                                                        width: '80px',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                        border: '0.5px solid rgba(0, 0, 0, .05)',
                                                        borderRadius: '50%',
                                                    }}
                                                >
                                                    <Avatar
                                                        aria-label="avatar"
                                                        sx={{
                                                            display: 'flex',
                                                            width: '60px',
                                                            height: '60px',
                                                            fontSize: '24px',
                                                            backgroundColor:
                                                                engine.color,
                                                        }}
                                                    >
                                                        {initial}
                                                    </Avatar>
                                                </Box>
                                            </Box>
                                            <Card.Header
                                                title={
                                                    <Typography variant="h5">
                                                        {engine.engine_name}
                                                    </Typography>
                                                }
                                                sx={{
                                                    color: '#000',
                                                    width: '100%',
                                                }}
                                                subheader={
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 2,
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                opacity: 0.9,
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                        >
                                                            {`Engine ID: `}
                                                            <Chip
                                                                label={
                                                                    engine.engine_id
                                                                }
                                                                size="small"
                                                            />
                                                        </span>
                                                        {`• `}
                                                    </Box>
                                                }
                                                action={
                                                    <IconButton
                                                        sx={{
                                                            mt: '16px',
                                                            color: 'rgba( 0, 0, 0, .7)',
                                                            mr: '24px',
                                                        }}
                                                        onClick={() => {
                                                            const filtered =
                                                                selectedNonCredentialedEngines.filter(
                                                                    (val) =>
                                                                        val.engine_id !==
                                                                        engine.engine_id,
                                                                );
                                                            setSelectedNonCredentialedEngines(
                                                                filtered,
                                                            );
                                                        }}
                                                    >
                                                        <ClearRounded />
                                                    </IconButton>
                                                }
                                            />
                                        </Box>
                                    );
                                },
                            )}

                        <Typography
                            variant="subtitle1"
                            sx={{
                                pt: '12px',
                                pb: '12px',
                                fontWeight: 'bold',
                                fontSize: '16',
                            }}
                        >
                            Permissions
                        </Typography>
                        <Box
                            sx={{
                                backgroundColor: 'rgba(0,0,0,.03)',
                                padding: '10px',
                                borderRadius: '8px',
                            }}
                        >
                            <RadioGroup
                                label={''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        setAddEngineRole(val as SETTINGS_ROLE);
                                    }
                                }}
                            >
                                <Stack spacing={1}>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor:
                                                                'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        A
                                                    </Avatar>
                                                    Author
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to edit the model
                                                    connection details, set the
                                                    model as discoverable,
                                                    provision other authors, and
                                                    all editor abilities.
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Author"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Icon
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            color: 'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        <EditRounded />
                                                    </Icon>
                                                    Editor
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to edit the model
                                                    details, provision other
                                                    users as editors and read
                                                    only users, and all read
                                                    only abilities.
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Editor"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Icon
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            color: 'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        EditRounded,
                                                        RemoveRedEyeRounded
                                                        <RemoveRedEyeRounded />
                                                    </Icon>
                                                    Read-Only
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to view model
                                                    details and usage
                                                    instructions
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Read-Only"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                </Stack>
                            </RadioGroup>
                        </Box>
                    </StyledModalContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="outlined"
                        onClick={() => setAddEngineModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        disabled={
                            !addEngineRole ||
                            selectedNonCredentialedEngines.length < 1
                        }
                        onClick={() => {
                            submitNonGroupEngines();
                        }}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteEngineModal} maxWidth="md">
                <Modal.Title>
                    <Typography variant="h6">Are you sure?</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>
                        {engineToDelete && (
                            <Typography variant="body1">
                                This will remove{' '}
                                <b>{engineToDelete.engine_name}</b>
                            </Typography>
                        )}
                    </Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteEngineModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="error"
                        variant={'contained'}
                        onClick={() => {
                            if (!engineToDelete) {
                                console.error('No engine to delete');
                            }
                            deleteEngine(engineToDelete);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteEnginesModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected engines?
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteEnginesModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        color="error"
                        onClick={() => {
                            deleteEnginePermissions();
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledEngineContent>
    );
};
