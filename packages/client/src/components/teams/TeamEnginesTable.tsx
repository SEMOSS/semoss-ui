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

import { SETTINGS_ROLE } from '@/components/settings/settings.types';
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

const StyledDropDownRowWrapper = styled('div')(({ theme }) => ({
    color: theme.palette.text.primary,
    marginBottom: '5px',
}));

const StyledDropDownRowInnerDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '0px 16px',
    gap: '18px',
    alignItems: 'center',
    color: theme.palette.text.primary,
}));

const StyledDropDownRowAvatar = styled(Avatar)({
    display: 'flex',
    width: '32px',
    height: '32px',
    fontSize: '16px',
});

const StyledDropDownRowInfo = styled('div')({
    display: 'flex',
    flexDirection: 'column',
});

const StyledDropDownRowIconDiv = styled('div')({
    display: 'flex',
    justifyContent: 'end',
    flexGrow: 1,
    alignContent: 'center',
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

type EngineObj = {
    engine_cost?: string;
    engine_created_by?: string;
    engine_created_by_type?: string;
    engine_date_created?: string;
    engine_discoverable?: boolean;
    engine_global?: boolean;
    engine_id?: string;
    engine_name?: string;
    engine_subtype?: string;
    engine_type?: string;
    low_engine_name?: string;
    permission?: number;
    id?: string;
    color?: string;
};

export const TeamEnginesTable = (props: EnginesTableProps) => {
    const { groupId, groupType } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const AUTOCOMPLETE_LIMIT = 10;
    const AUTOCOMPLETE_OFFSET = 0;

    /** Engine Table State */
    const [enginesPage, setEnginesPage] = useState<number>(1);
    const [selectedEngines, setSelectedEngines] = useState<EngineObj[]>([]);
    const [count, setCount] = useState(0);

    /** Delete Engine */
    const [deleteEnginesModal, setDeleteEnginesModal] =
        useState<boolean>(false);
    const [deleteEngineModal, setDeleteEngineModal] = useState<boolean>(false);
    const [engineToDelete, setEngineToDelete] = useState(null);

    /** Add Engine State */
    const [addEngineModal, setAddEngineModal] = useState<boolean>(false);
    const [nonCredentialedEngines, setNonCredentialedEngines] = useState<
        EngineObj[]
    >([]);
    const [selectedNonCredentialedEngines, setSelectedNonCredentialedEngines] =
        useState<EngineObj[]>([]);
    const [addEngineRole, setAddEngineRole] = useState<SETTINGS_ROLE>();

    const [engines, setEngines] = useState<EngineObj[]>([]);
    const [enginesCount, setEngineCount] = useState(null);
    const [hasEngines, setHasEngines] = useState<boolean>(false);

    const limit = 5;
    const [searchEngineInput, setSearchEngineInput] = useState<string>('');
    const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
    const [isScrollBottom, setIsScrollBottom] = useState<boolean>(false);
    const [canCollect, setCanCollect] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);

    const nearBottom = (
        target: {
            scrollHeight?: number;
            scrollTop?: number;
            clientHeight?: number;
        } = {},
    ) => {
        const diff = Math.round(target.scrollHeight - target.scrollTop);
        return diff - 25 <= target.clientHeight;
    };

    /**
     * @name getAdditionalEngines
     */
    const getAdditionalEngines = () => {
        setOffset(offset + AUTOCOMPLETE_LIMIT);
    };

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
                groupType,
                limit,
                enginesPage * limit - limit, // offset
                searchFilter,
            )
            .then((data) => {
                setEngines(data);
                setHasEngines(true);
            });
    }, []);

    useEffect(() => {
        if (isScrollBottom) {
            if (canCollect) {
                getAdditionalEngines();
            }
        }
    }, [isScrollBottom]);

    useEffect(() => {
        if (searchEngineInput) {
            setSearchLoading(true);
        }
        const timer = setTimeout(() => {
            if (!offset) {
                getEngines(true);
            } else {
                if (canCollect) {
                    getEngines(false);
                } else {
                    getEngines(true);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [offset, searchEngineInput]);

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
                    setOffset(0);
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
            setOffset(0);
            setSelectedNonCredentialedEngines([]);

            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the engines
            setCount(count + 1);
            setOffset(0);
        }
    };

    /**
     * @name deleteEngine
     * @param engine
     */
    const deleteEngine = async (engine: EngineObj) => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.deleteEnginePermission(
                groupId,
                groupType,
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
                        groupType,
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
    const getEngines = async (reset: boolean) => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        try {
            let response;
            // possibly add more db table columns / keys here to get id type for display under engines
            // eslint-disable-next-line prefer-const
            response = await monolithStore.getUnassignedTeamEngines(
                groupId,
                groupType,
                AUTOCOMPLETE_LIMIT,
                offset,
                searchEngineInput,
            );

            // ignore if there is no response
            if (response) {
                let requests = reset ? [] : nonCredentialedEngines;
                const engines = response.map((val) => {
                    return {
                        ...val,
                        color: colors[
                            Math.floor(Math.random() * colors.length)
                        ],
                    };
                });

                requests = requests.concat(engines);
                setNonCredentialedEngines(requests);
                setCanCollect(engines.length === AUTOCOMPLETE_LIMIT);
                setIsLoading(false);
                setSearchLoading(false);
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
            setIsLoading(false);
            setSearchLoading(false);
        }
    };

    /** ENGINES TABLE FUNCTIONS */
    const updateSelectedEngines = async (engine) => {
        try {
            if (!engine.engine_id) {
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

    engines.length > 9 && paginationOptions.enginesPageCounts.push(10);
    engines.length > 19 && paginationOptions.enginesPageCounts.push(20);

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
                    groupType,
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
                    groupType,
                    100,
                    0, // offset
                    searchFilter,
                )
                .then((data) => setEngineCount(data.length));
        },
        [count, enginesPage, searchFilter],
        200,
    );

    function capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

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
                                        getEngines(true);
                                        setAddEngineModal(true);
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
                                                        value.engine_id ===
                                                        engine.engine_id
                                                    );
                                                },
                                            );
                                        }
                                        if (engine) {
                                            return (
                                                <Table.Row
                                                    key={engine.engine_id + i}
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
                                                                                p.engine_id !==
                                                                                engine.engine_id
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
                                                                {`Engine ID: ${engine.engine_id}`}
                                                            </Stack>
                                                        </NameIDWrapper>
                                                    </UserInfoTableCell>
                                                    <Table.Cell size="medium">
                                                        <RadioGroup
                                                            row
                                                            defaultValue={String(
                                                                engine.permission,
                                                            )}
                                                            onChange={(e) => {
                                                                console.log(
                                                                    'Hit Update Permission fn and fix in state',
                                                                );
                                                                updateSelectedEngines(
                                                                    {
                                                                        engine_id:
                                                                            engine.engine_id,
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
                                    getEngines(true);
                                    setAddEngineModal(true);
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
                            loading={searchLoading}
                            multiple={true}
                            freeSolo={false}
                            filterOptions={(x) => x}
                            options={nonCredentialedEngines}
                            includeInputInList={true}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${selectedNonCredentialedEngines.length - 2}`
                            }
                            value={selectedNonCredentialedEngines}
                            inputValue={searchEngineInput}
                            renderOption={(props, option: EngineObj) => (
                                <li {...props}>
                                    <StyledDropDownRowInnerDiv>
                                        <StyledDropDownRowAvatar
                                            aria-label="avatar"
                                            sx={{
                                                backgroundColor: option.color,
                                            }}
                                        >
                                            {option.engine_name
                                                ? option.engine_name.indexOf(
                                                      ' ',
                                                  ) > -1
                                                    ? `${option.engine_name[0].toUpperCase()}${option.engine_name[
                                                          option.engine_name.indexOf(
                                                              ' ',
                                                          ) + 1
                                                      ].toUpperCase()}`
                                                    : option.engine_name[0].toUpperCase()
                                                : option.engine_id[0].toUpperCase()}
                                        </StyledDropDownRowAvatar>
                                        <StyledDropDownRowInfo>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontWeight: '600' }}
                                            >
                                                {option.engine_name}
                                            </Typography>
                                            <div style={{ display: 'flex' }}>
                                                <Typography variant="body2">
                                                    {option.engine_type
                                                        ? `${capitalizeFirstLetter(
                                                              option.engine_type,
                                                          )} | Engine ID: ${
                                                              option.engine_id
                                                          }`
                                                        : `Engine ID: ${option.engine_id}`}
                                                </Typography>
                                            </div>
                                        </StyledDropDownRowInfo>
                                    </StyledDropDownRowInnerDiv>
                                </li>
                            )}
                            getOptionLabel={(option: EngineObj) => {
                                return `${option.engine_name}`;
                            }}
                            isOptionEqualToValue={(
                                option: EngineObj,
                                value: EngineObj,
                            ) => {
                                return option.engine_name === value.engine_name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedEngines([
                                    ...newValue,
                                ]);
                            }}
                            ListboxProps={{
                                onScroll: ({ target }) =>
                                    setIsScrollBottom(
                                        nearBottom(
                                            target as {
                                                scrollHeight?: number;
                                                scrollTop?: number;
                                                clientHeight?: number;
                                            },
                                        ),
                                    ),
                            }}
                            onInputChange={(event, newValue) => {
                                setSearchEngineInput(newValue);
                                setOffset(0);
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
                                        <StyledDropDownRowWrapper key={idx}>
                                            <StyledDropDownRowInnerDiv>
                                                <StyledDropDownRowAvatar
                                                    aria-label="avatar"
                                                    sx={{
                                                        backgroundColor:
                                                            engine.color,
                                                    }}
                                                >
                                                    {initial}
                                                </StyledDropDownRowAvatar>
                                                <StyledDropDownRowInfo>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: '600',
                                                        }}
                                                    >
                                                        {engine.engine_name}
                                                    </Typography>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                        }}
                                                    >
                                                        <Typography variant="body2">
                                                            {engine.engine_type
                                                                ? `${capitalizeFirstLetter(
                                                                      engine.engine_type,
                                                                  )} | Engine ID: ${
                                                                      engine.engine_id
                                                                  }`
                                                                : `Engine ID: ${engine.engine_id}`}
                                                        </Typography>
                                                    </div>
                                                </StyledDropDownRowInfo>
                                                <StyledDropDownRowIconDiv>
                                                    <IconButton
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
                                                        <ClearRounded
                                                            sx={{
                                                                fontSize:
                                                                    '24px',
                                                            }}
                                                        />
                                                    </IconButton>
                                                </StyledDropDownRowIconDiv>
                                            </StyledDropDownRowInnerDiv>
                                        </StyledDropDownRowWrapper>
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
                                                            width: '24px',
                                                            height: '24px',
                                                            mt: '0px',
                                                            marginRight: '12px',
                                                            fontSize: '24px',
                                                            fontWeight: 'bold',
                                                            color: 'rgba(0, 0, 0, .5)',
                                                            maxWidth: '24px',
                                                            display: 'flex', // Ensure the icon is displayed properly
                                                            alignItems:
                                                                'center', // Center the icon vertically
                                                            justifyContent:
                                                                'center',
                                                        }}
                                                    >
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
                        onClick={() => {
                            setAddEngineModal(false);
                            setOffset(0);
                            setNonCredentialedEngines([]);
                        }}
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
