import { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    styled,
    Button,
    Checkbox,
    Table,
    IconButton,
    AvatarGroup,
    Avatar,
    Modal,
    RadioGroup,
    Typography,
    Autocomplete,
    Card,
    Box,
    Chip,
    Icon,
    Link,
    Search,
    Stack,
    useNotification,
} from '@semoss/ui';
import {
    Delete,
    EditRounded,
    RemoveRedEyeRounded,
    ClearRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { useRootStore, useAPI, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { SETTINGS_TYPE, SETTINGS_ROLE } from './settings.types';
import { MonolithStore } from '@/stores';

const colors = [
    '#22A4FF',
    '#FA3F20',
    '#FA3F20',
    '#FF9800',
    '#FF9800',
    '#22A4FF',
    '#4CAF50',
];

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

const StyledMemberTable = styled(Table)({});

const StyledTableTitleContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
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

const StyledAvatarGroupContainer = styled('div')({
    display: 'flex',
    width: '130px',
    height: '56px',
    padding: '10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
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

const StyledNoMembersContainer = styled('div')({
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledNoMembersDiv = styled('div')({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
});

const StyledCard = styled(Card)({
    borderRadius: '12px',
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

const StyledModalContentText = styled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

interface MembersTableProps {
    /**
     * Type of setting
     */
    type: SETTINGS_TYPE;

    /**
     * Id of the setting
     */
    id: string;
}

export const MembersTable = (props: MembersTableProps) => {
    const { type, id } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

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
    const [addMemberRole, setAddMemberRole] = useState<SETTINGS_ROLE>();

    const memberSearchRef = useRef(undefined);
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

    // get the api
    const getMembersApi: Parameters<typeof useAPI>[0] =
        type === 'database' || type === 'model' || type === 'storage'
            ? [
                  'getEngineUsers',
                  adminMode,
                  id,
                  searchFilter ? searchFilter : undefined,
                  permissionMapper[permissionFilter],
                  membersPage * limit - limit, // offset
                  limit,
              ]
            : type === 'app'
            ? [
                  'getProjectUsers',
                  adminMode,
                  id,
                  searchFilter ? searchFilter : undefined,
                  permissionMapper[permissionFilter],
                  membersPage * limit - limit, // offset
                  limit,
              ]
            : null;

    const getMembers = useAPI(getMembersApi);

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

        memberSearchRef.current?.focus();
        return () => {
            console.log('Cleaning members table');
            setValue('MEMBERS', []);
            setSelectedMembers([]);
        };
    }, [getMembers.status, getMembers.data, searchFilter, permissionFilter]);

    /** MEMBER TABLE FUNCTIONS */
    const updateSelectedUsers = async (members, quickUpdate) => {
        try {
            // construct requests for post data
            const requests = members.map((m) => {
                return {
                    userid: m.id,
                    permission: quickUpdate ? quickUpdate : 'OWNER',
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
                response = await monolithStore.editEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'app') {
                response = await monolithStore.editProjectUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            }

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data.success) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully updated user permissions',
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
        } finally {
            // refresh the members
            getMembers.refresh();
        }
    };

    /**
     * @name deleteSelectedMembers
     * @param members
     */
    const deleteSelectedMembers = async (members: Member[]) => {
        try {
            // construct requests for post data
            const requests = members.map((m, i) => {
                return m.id;
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
                response = await monolithStore.removeEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'app') {
                response = await monolithStore.removeProjectUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            }

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data.success) {
                if (
                    verifiedMembers.length === requests.length &&
                    membersPage !== 1 &&
                    membersPage !== filteredMembersCount / limit
                ) {
                    setMembersPage(membersPage - 1);
                }

                // get index of members in order to remove
                const indexesToRemove = [];
                requests.forEach((mem) => {
                    verifiedMembers.find((m, i) => {
                        if (mem === m.id) indexesToRemove.push(i);
                    });
                });

                // remove indexes from react hook form
                memberRemove(indexesToRemove);

                const newMemberCount = membersCount - requests.length;
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
                    message: `Successfully removed ${
                        requests.length > 1 ? 'members' : 'member'
                    } from ${type}`,
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
        } finally {
            // refresh the members
            getMembers.refresh();
        }
    };

    /** ADD MEMBER FUNCTIONS */
    /**
     * @name getUsersNoCreds
     * @desc Gets all users without credentials
     */
    const getUsersNoCreds = async () => {
        try {
            let response: AxiosResponse<Record<string, unknown>[]> | null =
                null;
            if (type === 'database' || type === 'model' || type === 'storage') {
                response = await monolithStore.getEngineUsersNoCredentials(
                    adminMode,
                    id,
                );
            } else if (type === 'app') {
                response = await monolithStore.getProjectUsersNoCredentials(
                    adminMode,
                    id,
                );
            } else {
                return;
            }

            // ignore if there is no response
            if (response.data) {
                const users = response.data.map((val) => {
                    return {
                        ...val,
                        color: colors[
                            Math.floor(Math.random() * colors.length)
                        ],
                    };
                });

                setNonCredentialedUsers(users);
                setAddMembersModal(true);
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

    /**
     * @name submitNonCredUsers
     */
    const submitNonCredUsers = async () => {
        try {
            // construct requests for post data
            const requests = selectedNonCredentialedUsers.map((m) => {
                return {
                    userid: m.id,
                    permission: permissionMapper[addMemberRole],
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
                response = await monolithStore.addEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'app') {
                response = await monolithStore.addProjectUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            }

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data.success) {
                setMembersCount(
                    membersCount + selectedNonCredentialedUsers.length,
                );
                setAddMembersModal(false);
                setSelectedNonCredentialedUsers([]);
                setAddMemberRole(undefined);

                notification.add({
                    color: 'success',
                    message: 'Successfully added member permissions',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing user permissions`,
                });
            }
        } catch (e) {
            setAddMembersModal(false);
            setSelectedNonCredentialedUsers([]);
            setAddMemberRole(undefined);

            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the members
            getMembers.refresh();
        }
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

    /** END OF HELPERS */

    /** LOADING */
    if (getMembers.status !== 'SUCCESS' && !didMount.current) {
        return <LoadingScreen.Trigger description="Getting members" />;
    }

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                {membersCount > 0 ? (
                    <StyledTableContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>Members</Typography>
                            </StyledTableTitleDiv>

                            <StyledTableTitleMemberContainer>
                                {Avatars.length > 0 ? (
                                    <StyledAvatarGroupContainer>
                                        <AvatarGroup
                                            // sx={{ border: 'solid green' }}
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
                                ) : null}
                                <StyledTableTitleMemberCountContainer>
                                    <StyledTableTitleMemberCount>
                                        <Typography variant={'body1'}>
                                            {filteredMembersCount} Members
                                        </Typography>
                                    </StyledTableTitleMemberCount>
                                </StyledTableTitleMemberCountContainer>
                            </StyledTableTitleMemberContainer>

                            {/* <StyledFilterButtonContainer>
                                <IconButton>
                                    <FilterAltRounded></FilterAltRounded>
                                </IconButton>
                            </StyledFilterButtonContainer> */}

                            <StyledSearchButtonContainer>
                                <Search
                                    ref={memberSearchRef}
                                    placeholder={'Search members'}
                                    size={'small'}
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
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell>
                                        <Checkbox
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
                                    </Table.Cell>
                                    <Table.Cell>ID</Table.Cell>
                                    <Table.Cell>Name</Table.Cell>
                                    <Table.Cell>Permission</Table.Cell>
                                    <Table.Cell>Permission Date</Table.Cell>
                                    <Table.Cell>Action</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
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
                                            <Table.Row key={user.name + i}>
                                                <Table.Cell>
                                                    <Checkbox
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
                                                </Table.Cell>

                                                <Table.Cell
                                                    component="td"
                                                    scope="row"
                                                >
                                                    {user.id}
                                                </Table.Cell>
                                                <Table.Cell
                                                    component="td"
                                                    scope="row"
                                                >
                                                    {user.name}
                                                </Table.Cell>
                                                <Table.Cell>
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
                                                </Table.Cell>
                                                <Table.Cell>
                                                    Not Available
                                                </Table.Cell>
                                                <Table.Cell>
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
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    } else {
                                        return (
                                            <Table.Row
                                                key={i + 'No data available'}
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
                            <Table.Footer>
                                <Table.Row>
                                    <Table.Pagination
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
                                </Table.Row>
                            </Table.Footer>
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
                                        <Card.Header
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
                                    const val = e.target.value;
                                    if (val) {
                                        setAddMemberRole(val as SETTINGS_ROLE);
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
                                                        <RemoveRedEyeRounded />
                                                    </Icon>
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
