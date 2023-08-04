import { useEffect, useMemo, useState, useRef, SyntheticEvent } from 'react';
import { Navigate, useResolvedPath, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';

import { useRootStore, useSettings, usePixel, useAPI } from '@/hooks';

import { useNotification } from '@semoss/components';

import { AppSettings } from '../project';

import {
    Alert,
    ButtonGroup,
    Button,
    Grid,
    Checkbox as MuiCheckbox,
    Table as MuiTable,
    styled as MuiStyled,
    IconButton,
    ToggleTabsGroup,
    AvatarGroup,
    Avatar,
    Modal,
    RadioGroup,
    Typography,
    Autocomplete,
    Card as MuiCard,
    Box,
    Chip,
    Icon as MuiIcon,
    Link,
    Stack,
    ToggleButton,
} from '@semoss/ui';

import {
    Check,
    Close,
    Delete,
    FilterAltRounded,
    SearchOutlined,
    EditRounded,
    RemoveRedEyeRounded,
    ClearRounded,
    Lock,
    VisibilityOffRounded,
} from '@mui/icons-material';

import { LoadingScreen } from '@/components/ui';
import { Switch } from '@semoss/ui';

const colors = [
    '#22A4FF',
    '#FA3F20',
    '#FA3F20',
    '#FF9800',
    '#FF9800',
    '#22A4FF',
    '#4CAF50',
];

const StyledContent = MuiStyled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexShrink: '0',
}));

const StyledMemberContent = MuiStyled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '25px',
    flexShrink: '0',
});

const StyledMemberInnerContent = MuiStyled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    alignSelf: 'stretch',
});

const StyledTableContainer = MuiStyled(MuiTable.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledMemberTable = MuiStyled(MuiTable)({});

const StyledTableTitleContainer = MuiStyled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
});

const StyledTableTitleDiv = MuiStyled('div')({
    display: 'flex',
    padding: '12px 24px 12px 16px',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberContainer = MuiStyled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledAvatarGroupContainer = MuiStyled('div')({
    display: 'flex',
    width: '130px',
    height: '56px',
    padding: '10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberCountContainer = MuiStyled('div')({
    display: 'flex',
    height: '56px',
    padding: '6px 16px 6px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberCount = MuiStyled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSearchButtonContainer = MuiStyled('div')({
    display: 'flex',
    padding: '5px 8px',
    alignItems: 'center',
    gap: '10px',
});

const StyledFilterButtonContainer = MuiStyled('div')({
    display: 'flex',
    padding: '5px 8px',
    alignItems: 'center',
    gap: '10px',
});

const StyledDeleteSelectedContainer = MuiStyled('div')({
    display: 'flex',
    padding: '10px 8px 10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledAddMemberContainer = MuiStyled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledNoMembersContainer = MuiStyled('div')({
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledNoMembersDiv = MuiStyled('div')({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
});

const StyledCard = MuiStyled(MuiCard)({
    borderRadius: '12px',
});

const StyledIcon = MuiStyled(MuiIcon)(({ theme }) => ({
    // width: '20px',
    // height: '20px',
    // mt: '6px',
    // marginRight: '12px',
    // fontSize: '12px',
    // fontWeight: 'bold',
    color: 'rgba(0, 0, 0, .5)',
}));

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

/**
 * @name mapMonolithFunction
 */
const mapMonolithFunction = (
    workflow: 'database' | 'project' | 'insight',
    key: string,
) => {
    const API_MAP = {
        // key: Monolith Store Function Name
        // Pending Members Table
        databaseApproveUserRequest: 'approveDatabaseUserAccessRequest',
        projectApproveUserRequest: 'approveProjectUserAccessRequest',
        insightApproveUserRequest: 'approveInsightUserAccessRequest',

        databaseDenyUserRequest: 'denyDatabaseUserAccessRequest',
        projectDenyUserRequest: 'denyProjectUserAccessRequest',
        insightDenyUserRequest: 'denyInsightUserAccessRequest',

        // Members Table
        databaseGetNonCredUsers: 'getEngineUsersNoCredentials',
        databaseAddMember: 'addEngineUserPermissions',
        databaseUpdatePermissions: 'editEngineUserPermissions',
        databaseRemoveUserPermissions: 'removeEngineUserPermissions',

        projectGetNonCredUsers: 'getProjectUsersNoCredentials',
        projectAddMember: 'addProjectUserPermissions',
        projectRemoveUserPermissions: 'removeProjectUserPermissions',
        projectUpdatePermissions: 'editProjectUserPermissions',

        insightGetNonCredUsers: 'getInsightUsersNoCredentials',
        insightAddMember: 'addInsightUserPermissions',
        insightRemoveUserPermissions: 'removeInsightUserPermissions',
        insightUpdatePermissions: 'editInsightUserPermissions',

        // Properties
        databaseSetGlobal: 'setDatabaseGlobal',
        databaseSetVisible: 'setDatabaseVisiblity',

        projectSetGlobal: 'setProjectGlobal',
        projectSetVisible: 'setProjectVisiblity',

        insightSetGlobal: 'setInsightGlobal',
    };

    const monolithFunctionKey = API_MAP[`${workflow}${key}`];

    return monolithFunctionKey;
};

// Pending Members Table
interface PendingMember {
    ID: string;
    PERMISSION: string;
    REQUEST_TIMESTAMP: string;
    REQUEST_TYPE: string;
    REQUEST_USERID: string;
}

// Members Table
interface Member {
    id: string;
    name: string;
    EMAIL: string;
    SELECTED: boolean;
    permission: string;
    OG_PERMISSION?: string;
    CONFIRM_DELETE?: boolean;
}
interface PermissionConfig {
    id: string;
    name: string;
    global: boolean;
    visibility?: boolean;
    projectid?: string;
    // permission?: number;
}

export interface PermissionsProps {
    config: PermissionConfig;
}

export const Permissions = (props: PermissionsProps) => {
    const { id, name, global, visibility, projectid } = props.config;
    const resolvedPathname = useResolvedPath('').pathname;

    // Helper hooks
    const { monolithStore, configStore } = useRootStore();
    const adminMode = configStore.store.user.admin;

    // New Design State Items
    const [view, setView] = useState(0);

    // Actually see if user is an owner or editor, quick fix
    const permission = adminMode ? 1 : 3;

    // Props we use for api fns to hit | "project, database, insight"
    const type: 'database' | 'project' | 'insight' | '' =
        resolvedPathname.includes('database')
            ? 'database'
            : resolvedPathname.includes('project')
            ? 'project'
            : resolvedPathname.includes('insight')
            ? 'insight'
            : resolvedPathname.includes(`database/${id}`)
            ? 'database'
            : '';

    // if no api prop --> redirect
    if (!type) {
        return <Navigate to="/settings" replace />;
    }

    /**
     * @name updateSelectedUsers
     * @desc updates all selected users from verifiedMembers state
     * @desc Needs a clean up, BE has to fix what we pass them to
     * optimize this approach.
     */
    const updateSelectedUsers = (members, quickUpdate) => {
        // send to API
        const userArr = [];
        // Indexes to update through UI for MEMBERS field
        const indexesToUpdate = [];

        // members.forEach((mem, i) => {
        //     indexesToUpdate.push(verifiedMembers.indexOf(mem));
        //     userArr.push({
        //         userid: mem.id,
        //         permission: quickUpdate
        //             ? quickUpdate
        //             : permissionMapper[updatedPermissionField],
        //     });
        // });

        monolithStore[mapMonolithFunction(type, 'UpdatePermissions')](
            adminMode,
            id,
            userArr,
            projectid,
        )
            .then((resp) => {
                // try updating project permissions
                // update through ui rather than refreshing api call

                // indexesToUpdate.forEach((i) => {
                //     setValue(
                //         `MEMBERS.${i}.permission`,
                //         quickUpdate ? quickUpdate : 'OWNER',
                //     );
                // });

                // notification.add({
                //     color: 'success',
                //     content: quickUpdate
                //         ? `${members[0].id} has been updated`
                //         : 'All selected members have been updated',
                // });

                if (quickUpdate) return;
                // clear selected members arr in state
                // setSelectedMembers([]);
                // select all checkbox for db-members table
                // setSelectAllCheckboxState('members-table', []);

                // reset modal field
                // setValue('UPDATE_SELECTED_PERMISSION', '');

                // close modal
                // setUpdateMembersModal(false);
            })
            .catch((error) => {
                // notification.add({ color: 'error', content: error });
            });
    };

    /**
     * @name handleChange
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setView(newValue);
    };

    return (
        <StyledContent>
            <ToggleTabsGroup
                value={view}
                onChange={handleChange}
                aria-label="basic tabs example"
            >
                <ToggleTabsGroup.Item label="Member" />
                <ToggleTabsGroup.Item
                    label="Pending Requests"
                    disabled={permission === 3}
                />
                {type === 'project' && (
                    <ToggleTabsGroup.Item label="Data Apps" />
                )}
            </ToggleTabsGroup>

            {view === 0 && (
                <MembersTable
                    type={type}
                    name={name}
                    adminMode={adminMode}
                    id={id}
                    projectId={projectid}
                />
            )}
            {view === 1 && (
                <PendingMembersTable
                    type={type}
                    name={name}
                    adminMode={adminMode}
                    id={id}
                    projectId={projectid}
                />
            )}
            {view === 2 && <AppSettings id={id} />}
        </StyledContent>
    );
};

const StyledAlert = MuiStyled(Alert)(({ theme }) => ({
    width: '468px',
    height: theme.spacing(13),
    backgroundColor: theme.palette.background.paper,
}));

interface WorkflowAccessProps {
    type: 'database' | 'project' | 'insight';
    id: string;
    projectId: string;
    onDelete: () => void;
}

export const WorkflowAccess = (props: WorkflowAccessProps) => {
    const { type, id, projectId, onDelete } = props;

    const { monolithStore, configStore } = useRootStore();
    const admin = configStore.store.user.admin;
    const notification = useNotification();

    const [discoverable, setDiscoverable] = useState(false);
    const [global, setGlobal] = useState(false);

    const getWorkflowInfoString =
        type === 'database'
            ? `DatabaseInfo(database='${id}');`
            : type === 'project'
            ? `ProjectInfo(project='${id}')`
            : type === 'insight' && `1+1`;

    const workflowInfo = usePixel<{
        database_global: boolean;
        database_discoverable: boolean;
    }>(getWorkflowInfoString);

    useEffect(() => {
        // pixel call to get pending members
        if (workflowInfo.status !== 'SUCCESS' || !workflowInfo.data) {
            return;
        }

        setDiscoverable(workflowInfo.data.database_discoverable);
        setGlobal(workflowInfo.data.database_global);
    }, [workflowInfo.status, workflowInfo.data]);

    const deleteWorkflow = () => {
        let pixelString = '';
        if (type === 'database') {
            pixelString = `DeleteDatabase(database=['${id}']);`;
        } else {
            pixelString = `DeleteProject(project=['${id}']);`;
        }

        monolithStore.runQuery(pixelString).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    content: `Successfully deleted ${type}`,
                });

                // go back to settings
                onDelete();
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
                // setDeleteWorkflowModal(false);
            }
        });
    };

    /**
     * @name changeDiscoverable
     */
    const changeDiscoverable = () => {
        monolithStore[mapMonolithFunction(type, 'SetVisible')](
            admin,
            id,
            !discoverable,
        )
            .then((response) => {
                if (response.data) {
                    setDiscoverable(!discoverable);

                    notification.add({
                        color: 'success',
                        content: 'Succesfully editted visibility.',
                    });
                }
            })
            .catch((error) => {
                notification.add({ color: 'error', content: error });
            });
    };

    /**
     * @name changeGlobal
     */
    const changeGlobal = () => {
        monolithStore[mapMonolithFunction(type, 'SetGlobal')](
            admin,
            id,
            !global,
            projectId,
        )
            .then((response) => {
                if (response.data.success) {
                    setGlobal(!global);

                    notification.add({
                        color: 'success',
                        content: 'Succesfully editted global property.',
                    });
                }
            })
            .catch((error) => {
                notification.add({ color: 'error', content: error });
            });
    };

    return (
        <Grid container spacing={3}>
            <Grid item>
                <StyledAlert
                    icon={
                        <StyledIcon>
                            <Lock />
                        </StyledIcon>
                    }
                    action={
                        <Switch
                            title={
                                global
                                    ? `Make ${type} private`
                                    : `Make ${type} public`
                            }
                            checked={global}
                            onChange={() => {
                                changeGlobal();
                            }}
                        ></Switch>
                    }
                >
                    <Alert.Title>{global ? 'Public' : 'Private'}</Alert.Title>
                    {global
                        ? 'All members can access'
                        : 'No one outside of the specified member group can access'}
                </StyledAlert>
            </Grid>
            <Grid item>
                <StyledAlert
                    icon={
                        <StyledIcon>
                            <VisibilityOffRounded />
                        </StyledIcon>
                    }
                    action={
                        <Switch
                            title={
                                discoverable
                                    ? `Make ${type} non-discoverable`
                                    : `Make ${type} discoverable`
                            }
                            checked={discoverable}
                            onChange={() => {
                                changeDiscoverable();
                            }}
                        ></Switch>
                    }
                >
                    <Alert.Title>
                        {discoverable ? 'Discoverable' : 'Non-Discoverable'}
                    </Alert.Title>
                    Users {discoverable ? 'can' : 'cannot'} request access to
                    this database if private
                </StyledAlert>
            </Grid>
            <Grid item>
                <StyledAlert
                    icon={
                        <StyledIcon>
                            <Delete />
                        </StyledIcon>
                    }
                    action={
                        <Button variant="contained" color="error">
                            Delete
                        </Button>
                    }
                >
                    <Alert.Title>Delete Database</Alert.Title>
                    Remove database from catalog
                </StyledAlert>
            </Grid>
        </Grid>
    );
};

export const PendingMembersTable = (props) => {
    const { name, type, adminMode, id, projectId } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [selectedPending, setSelectedPending] = useState([]);

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

    const getPendingUsersString =
        type === 'database'
            ? `GetDatabaseUserAccessRequest(database='${id}');`
            : type === 'project'
            ? `GetProjectUserAccessRequest(project='${id}')`
            : type === 'insight' &&
              `GetInsightUserAccessRequest(project='${projectId}', id='${id}');`;

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
    >(adminMode ? getPendingUsersString : '');

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
    const approvePendingMembers = (
        members: PendingMember[],
        quickActionFlag?: boolean, // quick approve button
    ) => {
        const requests = [];
        // construct requests for post data
        members.forEach((mem, i) => {
            const memberRequest = {
                requestid: mem.ID,
                userid: mem.REQUEST_USERID,
                permission: permissionMapper[mem.PERMISSION],
            };
            requests.push(memberRequest);
        });

        // hit api with req'd fields
        monolithStore[mapMonolithFunction(type, 'ApproveUserRequest')](
            adminMode,
            id,
            requests,
            projectId,
        )
            .then((response) => {
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

                notification.add({
                    color: 'success',
                    content: 'Succesfully approved user permissions',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /**
     * @name denyPendingMembers
     * @param members - members to pass to deny api call
     * @param quickActionFlag - quick deny button on table
     * @description Deny Selected Pending Members
     */
    const denyPendingMembers = (
        members: PendingMember[],
        quickActionFlag?: boolean,
    ) => {
        const requestIds = [];
        // construct userids for post data
        members.forEach((mem: PendingMember, i) => {
            requestIds.push(mem.ID);
        });

        // hit api with req'd fields
        monolithStore[mapMonolithFunction(type, 'DenyUserRequest')](
            adminMode,
            id,
            requestIds,
            projectId,
        )
            .then((response) => {
                // get index of pending members in order to remove
                const indexesToRemove = [];
                requestIds.forEach((mem) => {
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
                        if (m.ID !== requestIds[0]) {
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

                notification.add({
                    color: 'success',
                    content: 'Succesfully denied user permissions',
                });
            })
            .catch((error) => {
                // show err to user
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
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
        value: string,
    ) => {
        const updatedPendingMems = pendingMembers.map((user) => {
            if (user.REQUEST_USERID === mem.REQUEST_USERID) {
                return {
                    ...user,
                    PERMISSION: value,
                };
            } else {
                return user;
            }
        });

        const updateSelectedPendingMems = selectedPending.map((user) => {
            if (user.REQUEST_USERID === mem.REQUEST_USERID) {
                return {
                    ...user,
                    PERMISSION: value,
                };
            } else {
                return user;
            }
        });

        setSelectedPending(updateSelectedPendingMems);
        setValue('PENDING_MEMBERS', updatedPendingMems);
    };

    const rowsToLoop = new Array(5).fill('');

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                {pendingMembers.length ? (
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
                                            {pendingMembers.length} pending
                                            requests
                                        </Typography>
                                    </StyledTableTitleMemberCount>
                                </StyledTableTitleMemberCountContainer>
                            </StyledTableTitleMemberContainer>

                            {/* <StyledSearchButtonContainer>
                                <IconButton>
                                    <SearchOutlined></SearchOutlined>
                                </IconButton>
                            </StyledSearchButtonContainer>

                            <StyledFilterButtonContainer>
                                <IconButton>
                                    <FilterAltRounded></FilterAltRounded>
                                </IconButton>
                            </StyledFilterButtonContainer> */}

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
                        </StyledTableTitleContainer>
                        <StyledMemberTable>
                            <MuiTable.Head>
                                <MuiTable.Row>
                                    <MuiTable.Cell>
                                        <MuiCheckbox
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
                                    </MuiTable.Cell>
                                    <MuiTable.Cell>Name</MuiTable.Cell>
                                    <MuiTable.Cell>Permission</MuiTable.Cell>
                                    <MuiTable.Cell>Request Date</MuiTable.Cell>
                                    <MuiTable.Cell>Actions</MuiTable.Cell>
                                </MuiTable.Row>
                            </MuiTable.Head>
                            <MuiTable.Body>
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
                                            <MuiTable.Row key={i}>
                                                <MuiTable.Cell>
                                                    <MuiCheckbox
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
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
                                                </MuiTable.Cell>
                                                <MuiTable.Cell
                                                    component="td"
                                                    scope="row"
                                                >
                                                    {user.REQUEST_USERID}
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    <RadioGroup
                                                        row
                                                        value={user.PERMISSION}
                                                        onChange={(e) => {
                                                            updatePendingMemberPermission(
                                                                user,
                                                                e.target
                                                                    .value as Role,
                                                            );
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
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    {user.REQUEST_TIMESTAMP}
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    <IconButton
                                                        onClick={() => {
                                                            approvePendingMembers(
                                                                [user],
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Check
                                                            color={'success'}
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
                                                </MuiTable.Cell>
                                            </MuiTable.Row>
                                        );
                                    } else {
                                        return (
                                            <MuiTable.Row
                                                key={i + 'No data available'}
                                            >
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                            </MuiTable.Row>
                                        );
                                    }
                                })}
                            </MuiTable.Body>
                        </StyledMemberTable>
                    </StyledTableContainer>
                ) : (
                    <StyledNoMembersContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>
                                    Pending Requests
                                </Typography>
                            </StyledTableTitleDiv>
                        </StyledTableTitleContainer>
                        <StyledNoMembersDiv>
                            <Typography variant={'body1'}>
                                No pending requests
                            </Typography>
                        </StyledNoMembersDiv>
                    </StyledNoMembersContainer>
                )}
            </StyledMemberInnerContent>
        </StyledMemberContent>
    );
};

const StyledModalContentText = MuiStyled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

type Role = 'Author' | 'Editor' | 'Read-Only' | '' | null;

export const MembersTable = (props) => {
    const { type, adminMode, id, projectId } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    /** Member Table State */
    const [membersCount, setMembersCount] = useState<number>(0);
    const [filteredMembersCount, setFilteredMembersCount] = useState<number>(0);
    const [membersPage, setMembersPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

    /** Delete Member */
    const [deleteMembersModal, setDeleteMembersModal] =
        useState<boolean>(false);
    const [deleteMemberModal, setDeleteMemberModal] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<Member | null>();

    /** Add Member State */
    const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
    const [nonCredentialedUsers, setNonCredentialedUsers] = useState([]);
    const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
        useState([]);
    const [addMemberRole, setAddMemberRole] = useState<Role>('');

    const didMount = useRef<boolean>(false);

    const { control, watch, setValue } = useForm<{
        MEMBERS: Member[];

        SEARCH_FILTER: string;
        ACCESS_FILTER: string;
    }>({
        defaultValues: {
            // Members Table
            MEMBERS: [],
            // Filters for Members table
            SEARCH_FILTER: '',
            ACCESS_FILTER: '',
        },
    });

    const { remove: memberRemove } = useFieldArray({
        control,
        name: 'MEMBERS',
    });

    const searchFilter = watch('SEARCH_FILTER');
    const permissionFilter = watch('ACCESS_FILTER');
    const verifiedMembers = watch('MEMBERS');

    // apiString for getMembers useAPI Hook
    const getMembersString:
        | 'getEngineUsers'
        | 'getProjectUsers'
        | 'getInsightUsers' =
        type === 'database'
            ? 'getEngineUsers'
            : type === 'project'
            ? 'getProjectUsers'
            : type === 'insight' && 'getInsightUsers';

    const getMembers = useAPI([
        getMembersString,
        adminMode,
        id,
        searchFilter ? searchFilter : undefined,
        permissionMapper[permissionFilter],
        membersPage * limit - limit, // offset
        limit,
        projectId, // make optional --> handles insight
    ]);

    /**
     * @name useEffect
     * @desc - sets members in react hook form
     */
    useEffect(() => {
        if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
            return;
        }

        const members = [];

        getMembers.data['members'].forEach((mem) => {
            members.push(mem);
        });

        setValue('MEMBERS', members);

        if (!didMount.current) {
            // set total members
            setMembersCount(getMembers.data['totalMembers']);
            didMount.current = true;
        }

        // Needed for total pages on pagination
        setFilteredMembersCount(getMembers.data['totalMembers']);

        return () => {
            console.log('Cleaning members table');
            setValue('MEMBERS', []);
            setSelectedMembers([]);
        };
    }, [getMembers.status, getMembers.data, searchFilter, permissionFilter]);

    /** MEMBER TABLE FUNCTIONS */
    const updateSelectedUsers = (members, quickUpdate) => {
        // Construct to send to API
        const userArr = [];

        members.forEach((mem, i) => {
            userArr.push({
                userid: mem.id,
                permission: quickUpdate ? quickUpdate : 'OWNER',
            });
        });

        monolithStore[mapMonolithFunction(type, 'UpdatePermissions')](
            adminMode,
            id,
            userArr,
            projectId,
        )
            .then((resp) => {
                notification.add({
                    color: 'success',
                    content: 'Updated member permssions',
                });
            })
            .catch((err) => {
                notification.add({
                    color: 'error',
                    content: err,
                });
                getMembers.refresh();
            });
    };

    /**
     * @name deleteSelectedMembers
     * @param members
     */
    const deleteSelectedMembers = (members: Member[]) => {
        const userArr = [];
        members.forEach((mem, i) => {
            userArr.push(mem.id);
        });

        monolithStore[mapMonolithFunction(type, 'RemoveUserPermissions')](
            adminMode,
            id,
            userArr,
            projectId,
        )
            .then((resp) => {
                if (
                    verifiedMembers.length === userArr.length &&
                    membersPage !== 1 &&
                    membersPage !== filteredMembersCount / limit
                ) {
                    setMembersPage(membersPage - 1);
                }

                // get index of members in order to remove
                const indexesToRemove = [];
                userArr.forEach((mem) => {
                    verifiedMembers.find((m, i) => {
                        if (mem === m.id) indexesToRemove.push(i);
                    });
                });

                // remove indexes from react hook form
                memberRemove(indexesToRemove);

                const newMemberCount = membersCount - userArr.length;
                setMembersCount(newMemberCount);

                // Clean selected Members in state
                if (!userToDelete) {
                    setSelectedMembers([]);
                    setDeleteMembersModal(false);
                } else {
                    // Quick Delete one member
                    const filteredSelectedMembers = selectedMembers.filter(
                        // find the single member that is being deleted and remove from selected members
                        (m) => m.id !== userToDelete.id,
                    );

                    // set new selected members
                    setSelectedMembers(filteredSelectedMembers);
                    setDeleteMemberModal(false);
                }

                notification.add({
                    color: 'success',
                    content: `Successfully removed ${
                        userArr.length > 1 ? 'members' : 'member'
                    } from ${type}`,
                });

                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });

                setDeleteMembersModal(false);
            });
    };

    /** ADD MEMBER FUNCTIONS */
    /**
     * @name getUsersNoCreds
     * @desc Gets all users without credentials
     */
    const getUsersNoCreds = () => {
        monolithStore[mapMonolithFunction(type, 'GetNonCredUsers')](
            adminMode,
            id,
            projectId, // req'd for insight level calls
        )
            .then((response) => {
                const users = response.map((val) => {
                    val.color =
                        colors[Math.floor(Math.random() * colors.length)];
                    return val;
                });
                setNonCredentialedUsers(users);
                setAddMembersModal(true);
            })
            .catch((err) => {
                // throw error if promise doesn't fulfill
                throw Error(err);
            });
    };

    /**
     * @name submitNonCredUsers
     */
    const submitNonCredUsers = () => {
        const userRequests = [];
        // construct for API
        selectedNonCredentialedUsers.forEach((mem, i) => {
            const requestTemplate = {
                userid: mem.id,
                permission: permissionMapper[addMemberRole],
            };
            userRequests.push(requestTemplate);
        });

        monolithStore[mapMonolithFunction(type, 'AddMember')](
            adminMode,
            id,
            userRequests,
            projectId,
        ) // fix this with projectId
            .then((resp) => {
                getMembers.refresh();

                setMembersCount(
                    membersCount + selectedNonCredentialedUsers.length,
                );
                setAddMembersModal(false);
                setSelectedNonCredentialedUsers([]);
                setAddMemberRole('');

                // setSelectedMembers([]);
                // setSelectAllCheckboxState('members-table', []);

                notification.add({
                    color: 'success',
                    content: 'Successfully added member permissions',
                });
            })
            .catch((error) => {
                setAddMembersModal(false);
                setSelectedNonCredentialedUsers([]);
                setAddMemberRole('');

                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /** HELPERS */
    const Avatars = useMemo(() => {
        if (!verifiedMembers.length) return [];

        let i = 0;
        const avatarList = [];
        while (i < 5 && i < verifiedMembers.length) {
            avatarList.push(
                <Avatar key={i}>
                    {verifiedMembers[i].name.charAt(0).toUpperCase()}
                </Avatar>,
            );

            i++;
        }

        return avatarList;
    }, [filteredMembersCount, verifiedMembers.length]);

    const paginationOptions = {
        membersPageCounts: [5],
    };

    membersCount > 9 && paginationOptions.membersPageCounts.push(10);
    membersCount > 19 && paginationOptions.membersPageCounts.push(20);

    const rowsToLoop = new Array(5).fill('');

    /** END OF HELPERS */

    /** LOADING */
    if (getMembers.status !== 'SUCCESS' && !didMount.current) {
        return <LoadingScreen.Trigger description="Getting members" />;
    }

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                {verifiedMembers.length ? (
                    <StyledTableContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>Members</Typography>
                            </StyledTableTitleDiv>

                            <StyledTableTitleMemberContainer>
                                <StyledAvatarGroupContainer>
                                    <AvatarGroup
                                        spacing={'small'}
                                        variant={'circular'}
                                        max={4}
                                        total={filteredMembersCount}
                                    >
                                        {Avatars.map((el) => {
                                            return el;
                                        })}
                                    </AvatarGroup>
                                </StyledAvatarGroupContainer>
                                <StyledTableTitleMemberCountContainer>
                                    <StyledTableTitleMemberCount>
                                        <Typography variant={'body1'}>
                                            {filteredMembersCount} Members
                                        </Typography>
                                    </StyledTableTitleMemberCount>
                                </StyledTableTitleMemberCountContainer>
                            </StyledTableTitleMemberContainer>

                            <StyledSearchButtonContainer>
                                <IconButton>
                                    <SearchOutlined></SearchOutlined>
                                </IconButton>
                            </StyledSearchButtonContainer>

                            <StyledFilterButtonContainer>
                                <IconButton>
                                    <FilterAltRounded></FilterAltRounded>
                                </IconButton>
                            </StyledFilterButtonContainer>

                            <StyledDeleteSelectedContainer>
                                {selectedMembers.length > 0 && (
                                    <Button
                                        variant={'outlined'}
                                        color="error"
                                        onClick={() =>
                                            setDeleteMembersModal(true)
                                        }
                                    >
                                        Delete Selected
                                    </Button>
                                )}
                            </StyledDeleteSelectedContainer>
                            <StyledAddMemberContainer>
                                <Button
                                    variant={'contained'}
                                    onClick={() => {
                                        getUsersNoCreds();
                                    }}
                                >
                                    Add Members{' '}
                                </Button>
                            </StyledAddMemberContainer>
                        </StyledTableTitleContainer>
                        <StyledMemberTable>
                            <MuiTable.Head>
                                <MuiTable.Row>
                                    <MuiTable.Cell>
                                        <MuiCheckbox
                                            checked={
                                                selectedMembers.length ===
                                                    verifiedMembers.length &&
                                                verifiedMembers.length > 0
                                            }
                                            onChange={() => {
                                                if (
                                                    selectedMembers.length !==
                                                    verifiedMembers.length
                                                ) {
                                                    setSelectedMembers(
                                                        verifiedMembers,
                                                    );
                                                } else {
                                                    setSelectedMembers([]);
                                                }
                                            }}
                                        />
                                    </MuiTable.Cell>
                                    <MuiTable.Cell>Name</MuiTable.Cell>
                                    <MuiTable.Cell>Permission</MuiTable.Cell>
                                    <MuiTable.Cell>
                                        Permission Date
                                    </MuiTable.Cell>
                                    <MuiTable.Cell>Action</MuiTable.Cell>
                                </MuiTable.Row>
                            </MuiTable.Head>
                            <MuiTable.Body>
                                {verifiedMembers.map((x, i) => {
                                    const user = verifiedMembers[i];

                                    let isSelected = false;

                                    if (user) {
                                        isSelected = selectedMembers.some(
                                            (value) => {
                                                return value.id === user.id;
                                            },
                                        );
                                    }
                                    if (user) {
                                        return (
                                            <MuiTable.Row key={user.name + i}>
                                                <MuiTable.Cell>
                                                    <MuiCheckbox
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                const selMembers =
                                                                    [];
                                                                selectedMembers.forEach(
                                                                    (u) => {
                                                                        if (
                                                                            u.id !==
                                                                            user.id
                                                                        )
                                                                            selMembers.push(
                                                                                u,
                                                                            );
                                                                    },
                                                                );
                                                                setSelectedMembers(
                                                                    selMembers,
                                                                );
                                                            } else {
                                                                setSelectedMembers(
                                                                    [
                                                                        ...selectedMembers,
                                                                        user,
                                                                    ],
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </MuiTable.Cell>
                                                <MuiTable.Cell
                                                    component="td"
                                                    scope="row"
                                                >
                                                    {user.id}: {user.name}
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    <RadioGroup
                                                        row
                                                        defaultValue={
                                                            permissionMapper[
                                                                user.permission
                                                            ]
                                                        }
                                                        onChange={(e) => {
                                                            console.log(
                                                                'Hit Update Permission fn and fix in state',
                                                            );
                                                            updateSelectedUsers(
                                                                [user],
                                                                permissionMapper[
                                                                    e.target
                                                                        .value
                                                                ],
                                                            );
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
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    Not Available
                                                </MuiTable.Cell>
                                                <MuiTable.Cell>
                                                    <IconButton
                                                        onClick={() => {
                                                            // set user
                                                            setUserToDelete(
                                                                user,
                                                            );
                                                            // open modal
                                                            setDeleteMemberModal(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Delete></Delete>
                                                    </IconButton>
                                                </MuiTable.Cell>
                                            </MuiTable.Row>
                                        );
                                    } else {
                                        return (
                                            <MuiTable.Row
                                                key={i + 'No data available'}
                                            >
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                                <MuiTable.Cell></MuiTable.Cell>
                                            </MuiTable.Row>
                                        );
                                    }
                                })}
                            </MuiTable.Body>
                            <MuiTable.Footer>
                                <MuiTable.Row>
                                    <MuiTable.Pagination
                                        rowsPerPageOptions={
                                            paginationOptions.membersPageCounts
                                        }
                                        onPageChange={(e, v) => {
                                            setMembersPage(v + 1);
                                            setSelectedMembers([]);
                                        }}
                                        page={membersPage - 1}
                                        rowsPerPage={5}
                                        count={filteredMembersCount}
                                    />
                                </MuiTable.Row>
                            </MuiTable.Footer>
                        </StyledMemberTable>
                    </StyledTableContainer>
                ) : (
                    <StyledNoMembersContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>Members</Typography>
                            </StyledTableTitleDiv>
                        </StyledTableTitleContainer>
                        <StyledNoMembersDiv>
                            <Typography variant={'body1'}>
                                No members present
                            </Typography>
                            <Button
                                variant={'contained'}
                                onClick={() => {
                                    getUsersNoCreds();
                                }}
                            >
                                Add Members{' '}
                            </Button>
                        </StyledNoMembersDiv>
                    </StyledNoMembersContainer>
                )}
            </StyledMemberInnerContent>
            <Modal open={deleteMembersModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected members
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteMembersModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        color="error"
                        onClick={() => {
                            deleteSelectedMembers(selectedMembers);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteMemberModal} maxWidth="md">
                <Modal.Title>
                    <Typography variant="h6">Are you sure?</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>
                        {userToDelete && (
                            <Typography variant="body1">
                                This will remove <b>{userToDelete.name}</b> from
                                the {type}
                            </Typography>
                        )}
                    </Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteMemberModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="error"
                        variant={'contained'}
                        onClick={() => {
                            if (!userToDelete) {
                                console.error('No user to delete');
                            }
                            deleteSelectedMembers([userToDelete]);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>

            <Modal open={addMembersModal} maxWidth="lg">
                <Modal.Title>Add Members</Modal.Title>
                <Modal.Content sx={{ width: '50rem' }}>
                    <StyledModalContentText>
                        <Autocomplete
                            label="Search"
                            multiple={true}
                            options={nonCredentialedUsers}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${selectedNonCredentialedUsers.length - 2}`
                            }
                            value={[...selectedNonCredentialedUsers]}
                            getOptionLabel={(option: any) => {
                                return `${option.name}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return option.name === value.name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedUsers([...newValue]);
                            }}
                        />

                        {selectedNonCredentialedUsers &&
                            selectedNonCredentialedUsers.map((user, idx) => {
                                const space = user.name.indexOf(' ');
                                const initial = user.name
                                    ? space > -1
                                        ? `${user.name[0].toUpperCase()}${user.name[
                                              space + 1
                                          ].toUpperCase()}`
                                        : user.name[0].toUpperCase()
                                    : user.id[0].toUpperCase();
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
                                                    justifyContent: 'center',
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
                                                            user.color,
                                                    }}
                                                >
                                                    {initial}
                                                </Avatar>
                                            </Box>
                                        </Box>
                                        <MuiCard.Header
                                            title={
                                                <Typography variant="h5">
                                                    {user.name}
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
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        {`User ID: `}
                                                        <Chip
                                                            label={user.id}
                                                            size="small"
                                                        />
                                                    </span>
                                                    {`• `}
                                                    <span>
                                                        {`Email: `}
                                                        <Link
                                                            href={`mailto:${user.email}`}
                                                            underline="none"
                                                        >
                                                            {user.email}
                                                        </Link>
                                                    </span>
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
                                                            selectedNonCredentialedUsers.filter(
                                                                (val) =>
                                                                    val.id !==
                                                                    user.id,
                                                            );
                                                        setSelectedNonCredentialedUsers(
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
                            })}

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
                                    setAddMemberRole(e.target.value as Role);
                                }}
                            >
                                <Stack spacing={1}>
                                    <StyledCard>
                                        <MuiCard.Header
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
                                                    sx={{ marginLeft: '30px' }}
                                                >
                                                    Ability to provision other
                                                    users, edit database details
                                                    and hide or delete the
                                                    database.
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
                                        <MuiCard.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <MuiIcon
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
                                                    </MuiIcon>
                                                    Editor
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{ marginLeft: '30px' }}
                                                >
                                                    Has the ability to use the
                                                    database to generate
                                                    insights and can query
                                                    against the database.
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
                                        <MuiCard.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <MuiIcon
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
                                                        <RemoveRedEyeRounded />
                                                    </MuiIcon>
                                                    Read-Only
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{ marginLeft: '30px' }}
                                                >
                                                    Can view insights built
                                                    using the database.
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
                        onClick={() => setAddMembersModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        disabled={
                            !addMemberRole ||
                            selectedNonCredentialedUsers.length < 1
                        }
                        onClick={() => {
                            submitNonCredUsers();
                        }}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledMemberContent>
    );
};
