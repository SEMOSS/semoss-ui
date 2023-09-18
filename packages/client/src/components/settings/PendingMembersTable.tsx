import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    styled,
    Button,
    Collapse,
    Checkbox,
    Divider,
    Table,
    Icon,
    IconButton,
    RadioGroup,
    Typography,
    useNotification,
} from '@semoss/ui';
import { Add, Check, Close, ExpandLess, ExpandMore } from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { useRootStore, usePixel, useSettings } from '@/hooks';

import { SETTINGS_ROLE, SETTINGS_TYPE } from './settings.types';

const StyledMemberContent = styled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '25px',
    flexShrink: '0',
});

const StyledMemberInnerContent = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    alignSelf: 'stretch',
});

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTableRow = styled(Table.Row)({
    backgroundColor: '#FFF',
});

const StyledMemberTable = styled(Table)({});

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

const StyledTableTitleMemberContainer = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledTableTitleMemberCountContainer = styled('div')({
    display: 'flex',
    height: '56px',
    padding: '6px 16px 6px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberCount = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSearchButtonContainer = styled('div')({
    display: 'flex',
    // padding: '5px 8px',
    alignItems: 'center',
    // gap: '10px',
});

const StyledFilterButtonContainer = styled('div')({
    display: 'flex',
    padding: '5px 8px',
    alignItems: 'center',
    gap: '10px',
});

const StyledDeleteSelectedContainer = styled('div')({
    display: 'flex',
    padding: '10px 8px 10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledAddMemberContainer = styled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

// maps for permissions,
const permissionMapper = {
    1: 'Author', // BE: 'DISPLAY'
    OWNER: 'Author', // BE: 'DISPLAY'
    Author: 'OWNER', // DISPLAY: BE
    2: 'Editor', // BE: 'DISPLAY'
    EDIT: 'Editor', // BE: 'DISPLAY'
    Editor: 'EDIT', // DISPLAY: BE
    3: 'Read-Only', // BE: 'DISPLAY'
    READ_ONLY: 'Read-Only', // BE: 'DISPLAY'
    'Read-Only': 'READ_ONLY', // DISPLAY: BE
};

// Pending Members Table
interface PendingMember {
    ID: string;
    NAME: string;
    EMAIL: string;
    PERMISSION: SETTINGS_ROLE;
    // Requester Info
    REQUEST_TIMESTAMP: string;
    REQUEST_TYPE: string;
    REQUEST_USERID: string;
}

const StyledNoPendingReqs = styled('div')(({ theme }) => ({
    width: '100%',
    height: theme.spacing(6),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
}));

interface PendingMemberTableProps {
    /**
     * Type of setting
     */
    type: SETTINGS_TYPE;

    /**
     * Id of the setting
     */
    id: string;
}

export const PendingMembersTable = (props: PendingMemberTableProps) => {
    const { type, id } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [selectedPending, setSelectedPending] = useState([]);
    const [openTable, setOpenTable] = useState(false);

    const { control, watch, setValue } = useForm<{
        PENDING_MEMBERS: PendingMember[];
    }>({
        defaultValues: {
            // Members Table
            PENDING_MEMBERS: [],
        },
    });

    const { remove: pendingMemberRemove } = useFieldArray({
        control,
        name: 'PENDING_MEMBERS',
    });
    const pendingMembers = watch('PENDING_MEMBERS');

    useEffect(() => {
        if (pendingMembers.length) {
            setOpenTable(true);
        }
    }, [pendingMembers]);

    const pendingUserAccessPixel =
        type === 'database' || type === 'model' || type === 'storage'
            ? `GetEngineUserAccessRequest(engine='${id}');`
            : type === 'app'
            ? `GetProjectUserAccessRequest(project='${id}')`
            : '';

    // Pending Member Requests Pixel call
    const pendingUserAccess = usePixel<
        {
            ENGINEID: string;
            ID: string;
            PERMISSION: number;
            REQUEST_TIMESTAMP: string;
            REQUEST_TYPE: string;
            REQUEST_USERID: string;
        }[]
    >(pendingUserAccessPixel);

    /**
     * @name useEffect
     * @desc - sets pending members in react hook form
     */
    useEffect(() => {
        // pixel call to get pending members
        if (pendingUserAccess.status !== 'SUCCESS' || !pendingUserAccess.data) {
            return;
        }

        const newPendingMembers = [];

        pendingUserAccess.data.forEach((mem) => {
            newPendingMembers.push({
                ...mem,
                PERMISSION: permissionMapper[mem.PERMISSION], // comes in as 1,2,3 -> map to Author, Edit, Read-only
            });
        });

        // set new members with the Pending Members in react hook form
        setValue('PENDING_MEMBERS', newPendingMembers);

        // notify user for pending members
        if (newPendingMembers.length) {
            let message =
                newPendingMembers.length === 1
                    ? `1 member has `
                    : `${newPendingMembers.length} members have `;

            message += `requested access to this ${type}`;
        }

        return () => {
            console.log('cleaning Pending Members');
            // setValue('PENDING_MEMBERS', []);
            // setSelectedPendingMembers([]);
            // setSelectAllPendingMembers(false);
            // setPendingMembersIndeterminate(false);
        };
    }, [pendingUserAccess.status, pendingUserAccess.data]);

    /** API Functions */
    /**
     * @name approvePendingMembers
     * @param members - members to pass to approve api call
     * @description Approve list of Pending Members
     */
    const approvePendingMembers = async (
        members: PendingMember[],
        quickActionFlag?: boolean, // quick approve button
    ) => {
        try {
            // construct requests for post data
            const requests = members.map((mem, i) => {
                return {
                    requestid: mem.ID,
                    userid: mem.REQUEST_USERID,
                    permission: permissionMapper[mem.PERMISSION],
                };
            });

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No permissions to change`,
                });

                return;
            }

            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (type === 'database' || type === 'model' || type === 'storage') {
                response = await monolithStore.approveEngineUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'app') {
                response = await monolithStore.approveProjectUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            }

            // ignore if there is no response
            if (!response) {
                return;
            }

            // if (response.success) {
            // get index of pending members in order to remove
            const indexesToRemove = [];
            requests.forEach((mem) => {
                pendingMembers.find((m, i) => {
                    if (mem.userid === m.REQUEST_USERID)
                        indexesToRemove.push(i);
                });
            });

            // remove indexes
            pendingMemberRemove(indexesToRemove);

            if (!quickActionFlag) {
                // remove from selected pending members
                setSelectedPending([]);
            } else {
                let indexToRemoveFromSelected;
                // remove from selected
                selectedPending.find((m, i) => {
                    if (m.ID !== requests[0].requestid) {
                        indexToRemoveFromSelected = i;
                    }
                });

                const filteredArr = selectedPending.splice(
                    indexToRemoveFromSelected,
                    1,
                );

                setSelectedPending(filteredArr);
            }

            if (response.data.success) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully approved user permissions',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing user permissions`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

    /**
     * @name denyPendingMembers
     * @param members - members to pass to deny api call
     * @param quickActionFlag - quick deny button on table
     * @description Deny Selected Pending Members
     */
    const denyPendingMembers = async (
        members: PendingMember[],
        quickActionFlag?: boolean,
    ) => {
        try {
            // construct requests for post data
            const requests = members.map((m) => {
                return m.ID;
            });

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No permissions to change`,
                });

                return;
            }

            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (type === 'database' || type === 'model' || type === 'storage') {
                response = await monolithStore.denyEngineUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'app') {
                response = await monolithStore.denyProjectUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            }

            // ignore if there is no response
            if (!response) {
                return;
            }

            // get index of pending members in order to remove
            const indexesToRemove = [];
            requests.forEach((mem) => {
                pendingMembers.find((m, i) => {
                    if (mem === m.ID) indexesToRemove.push(i);
                });
            });

            // remove indexes from react hook form
            pendingMemberRemove(indexesToRemove);

            if (!quickActionFlag) {
                setSelectedPending([]);
                // close modal
                // setDenySelectedModal(false);
            } else {
                // remove from selected pending members
                let indexToRemoveFromSelected = 0;
                // remove from selected
                selectedPending.find((m, i) => {
                    if (m.ID !== requests[0]) {
                        indexToRemoveFromSelected = i;
                    }
                });

                const filteredArr = selectedPending.splice(
                    indexToRemoveFromSelected,
                    1,
                );

                setSelectedPending(filteredArr);
                // close modal
                // setDenySelectedModal(false);
            }

            if (response.data.success) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully denied user permissions',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing user permissions`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

    /** HELPERS */
    /**
     * @name updatePendingMemberPermission
     * @param mem
     * @param value
     * @desc Updates pending member permission in radiogroup
     */
    const updatePendingMemberPermission = (
        mem: PendingMember,
        role: SETTINGS_ROLE,
    ) => {
        const updatedPendingMems = pendingMembers.map((user) => {
            if (user.REQUEST_USERID === mem.REQUEST_USERID) {
                return {
                    ...user,
                    PERMISSION: role,
                };
            } else {
                return user;
            }
        });

        const updateSelectedPendingMems = selectedPending.map((user) => {
            if (user.REQUEST_USERID === mem.REQUEST_USERID) {
                return {
                    ...user,
                    PERMISSION: role,
                };
            } else {
                return user;
            }
        });

        setSelectedPending(updateSelectedPendingMems);
        setValue('PENDING_MEMBERS', updatedPendingMems);
    };

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>
                                Pending Requests
                            </Typography>
                        </StyledTableTitleDiv>

                        <StyledTableTitleMemberContainer>
                            <StyledTableTitleMemberCountContainer>
                                <StyledTableTitleMemberCount>
                                    <Typography variant={'body1'}>
                                        {pendingMembers.length < 2
                                            ? `${pendingMembers.length} pending request`
                                            : `${pendingMembers.length} pending requests`}
                                    </Typography>
                                </StyledTableTitleMemberCount>
                            </StyledTableTitleMemberCountContainer>
                        </StyledTableTitleMemberContainer>

                        <StyledSearchButtonContainer>
                            <IconButton>
                                {/* <SearchOutlined></SearchOutlined> */}
                            </IconButton>
                        </StyledSearchButtonContainer>

                        <StyledFilterButtonContainer>
                            <IconButton>
                                {/* <FilterAltRounded></FilterAltRounded> */}
                            </IconButton>
                        </StyledFilterButtonContainer>

                        {selectedPending.length > 0 && (
                            <>
                                <StyledDeleteSelectedContainer>
                                    <Button
                                        variant={'outlined'}
                                        color="error"
                                        onClick={() => {
                                            denyPendingMembers(
                                                selectedPending,
                                                false,
                                            );
                                        }}
                                    >
                                        Deny Selected
                                    </Button>
                                </StyledDeleteSelectedContainer>
                                <StyledAddMemberContainer>
                                    <Button
                                        variant={'contained'}
                                        onClick={() => {
                                            approvePendingMembers(
                                                selectedPending,
                                                false,
                                            );
                                        }}
                                    >
                                        Approve Selected
                                    </Button>
                                </StyledAddMemberContainer>
                            </>
                        )}
                        <StyledFilterButtonContainer>
                            <IconButton
                                onClick={() => setOpenTable(!openTable)}
                            >
                                {openTable ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </StyledFilterButtonContainer>
                    </StyledTableTitleContainer>
                    <Collapse in={openTable}>
                        {pendingMembers.length ? (
                            <StyledMemberTable>
                                <Table.Head>
                                    <StyledTableRow>
                                        <Table.Cell size="small">
                                            <Checkbox
                                                checked={
                                                    selectedPending.length ===
                                                        pendingMembers.length &&
                                                    pendingMembers.length > 0
                                                }
                                                onChange={() => {
                                                    if (
                                                        selectedPending.length !==
                                                        pendingMembers.length
                                                    ) {
                                                        setSelectedPending(
                                                            pendingMembers,
                                                        );
                                                    } else {
                                                        setSelectedPending([]);
                                                    }
                                                }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell size="small">ID</Table.Cell>
                                        <Table.Cell size="small">
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                Name
                                                <Divider></Divider>
                                                <Icon
                                                    sx={{
                                                        color: '#E9E9E9',
                                                    }}
                                                >
                                                    <Add />
                                                </Icon>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                Request Date
                                                <Divider></Divider>
                                                <Icon
                                                    sx={{
                                                        color: '#E9E9E9',
                                                    }}
                                                >
                                                    <Add />
                                                </Icon>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Permission
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Actions
                                        </Table.Cell>
                                    </StyledTableRow>
                                </Table.Head>
                                <Table.Body>
                                    {pendingMembers.map((x, i) => {
                                        const user = pendingMembers[i];

                                        let isSelected = false;

                                        if (user) {
                                            isSelected = selectedPending.some(
                                                (value: PendingMember) => {
                                                    return (
                                                        value.REQUEST_USERID ===
                                                        user.REQUEST_USERID
                                                    );
                                                },
                                            );
                                        }
                                        if (user) {
                                            return (
                                                <StyledTableRow key={i}>
                                                    <Table.Cell>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    const selPending =
                                                                        [];
                                                                    selectedPending.forEach(
                                                                        (
                                                                            u: PendingMember,
                                                                        ) => {
                                                                            if (
                                                                                u.REQUEST_USERID !==
                                                                                user.REQUEST_USERID
                                                                            )
                                                                                selPending.push(
                                                                                    u,
                                                                                );
                                                                        },
                                                                    );

                                                                    setSelectedPending(
                                                                        selPending,
                                                                    );
                                                                } else {
                                                                    setSelectedPending(
                                                                        [
                                                                            ...selectedPending,
                                                                            user,
                                                                        ],
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </Table.Cell>
                                                    <Table.Cell
                                                        component="td"
                                                        scope="row"
                                                    >
                                                        {user.REQUEST_USERID}
                                                    </Table.Cell>
                                                    <Table.Cell
                                                        component="td"
                                                        scope="row"
                                                    >
                                                        {user.NAME}
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        {user.REQUEST_TIMESTAMP}
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <RadioGroup
                                                            row
                                                            value={
                                                                user.PERMISSION
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;
                                                                if (val) {
                                                                    updatePendingMemberPermission(
                                                                        user,
                                                                        val as SETTINGS_ROLE,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <RadioGroup.Item
                                                                value="Author"
                                                                label="Author"
                                                            />
                                                            <RadioGroup.Item
                                                                value="Editor"
                                                                label="Editor"
                                                            />
                                                            <RadioGroup.Item
                                                                value="Read-Only"
                                                                label="Read-Only"
                                                            />
                                                        </RadioGroup>
                                                    </Table.Cell>

                                                    <Table.Cell>
                                                        <IconButton
                                                            onClick={() => {
                                                                approvePendingMembers(
                                                                    [user],
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                color={
                                                                    'success'
                                                                }
                                                            />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => {
                                                                denyPendingMembers(
                                                                    [user],
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    </Table.Cell>
                                                </StyledTableRow>
                                            );
                                        } else {
                                            return (
                                                <Table.Row
                                                    key={
                                                        i + 'No data available'
                                                    }
                                                >
                                                    <Table.Cell></Table.Cell>
                                                    <Table.Cell></Table.Cell>
                                                    <Table.Cell></Table.Cell>
                                                    <Table.Cell></Table.Cell>
                                                    <Table.Cell></Table.Cell>
                                                </Table.Row>
                                            );
                                        }
                                    })}
                                </Table.Body>
                            </StyledMemberTable>
                        ) : (
                            <StyledNoPendingReqs>
                                <Typography variant={'body1'}>
                                    0 requests currently pending
                                </Typography>
                            </StyledNoPendingReqs>
                        )}
                    </Collapse>
                </StyledTableContainer>
            </StyledMemberInnerContent>
        </StyledMemberContent>
    );
};
