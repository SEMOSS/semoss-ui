import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
    styled,
    Button,
    Checkbox,
    Table,
    IconButton,
    AvatarGroup,
    Avatar,
    Modal,
    Typography,
    Autocomplete,
    Card,
    Box,
    Chip,
    Link,
    Search,
    Stack,
    useNotification,
} from '@semoss/ui';
import { Delete, ClearRounded } from '@mui/icons-material';
import { AxiosResponse } from 'axios';

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

const AvatarWrapper = styled('div')({
    display: 'inline-block',
    width: '50px',
});

const NameIDWrapper = styled('div')({
    display: 'inline-block',
});

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
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledMemberTable = styled(Table)({ backgroundColor: 'white' });

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

const StyledTableCell = styled(Table.Cell)({
    paddingLeft: '16px',
});

const StyledEmptyTableCell = styled(Table.Cell)({
    width: '700px',
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

interface MembersTableProps {
    /**
     * Id of the setting
     */
    groupId: string;

    name: string;
}

export const TeamMembersTable = (props: MembersTableProps) => {
    const { groupId } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    /** Member Table State */
    const [membersPage, setMembersPage] = useState<number>(1);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [count, setCount] = useState(0);

    /** Delete Member */
    const [deleteMembersModal, setDeleteMembersModal] =
        useState<boolean>(false);
    const [deleteMemberModal, setDeleteMemberModal] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState(null);

    /** Add Member State */
    const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
    const [nonCredentialedUsers, setNonCredentialedUsers] = useState([]);
    const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
        useState([]);

    const [teamMembers, setTeamMembers] = useState(null);
    const [memberCount, setMemberCount] = useState(null);
    const [hasMembers, setHasMembers] = useState(false);

    const limit = 5;

    const memberSearchRef = useRef(undefined);

    const { watch, setValue } = useForm<{
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Filters for Members table
            SEARCH_FILTER: '',
        },
    });

    const searchFilter = watch('SEARCH_FILTER');

    /**
     * @name useEffect
     * @desc - sets members in react hook form
     */
    useEffect(() => {
        monolithStore
            .getTeamUsers(
                groupId,
                limit,
                membersPage * limit - limit, // offset
                searchFilter,
            )
            .then((data) => {
                setTeamMembers(data);
                setHasMembers(true);
            });
    }, []);

    /**
     * @name submitNonGroupUsers
     */
    const submitNonGroupUsers = async () => {
        try {
            // construct requests for post data
            const requests = selectedNonCredentialedUsers.map((m) => {
                return {
                    userid: m.id,
                    type: m.type,
                };
            });

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No users to add`,
                });

                return;
            }

            for (let i = 0; i < requests.length; i++) {
                let response: AxiosResponse<{ success: boolean }> | null = null;
                response = await monolithStore.addTeamUser(
                    groupId,
                    requests[i].type,
                    requests[i].userid,
                    true,
                );

                if (!response) {
                    return;
                }

                // ignore if there is no response
                if (response) {
                    setAddMembersModal(false);
                    setSelectedNonCredentialedUsers([]);

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
            }
        } catch (e) {
            setAddMembersModal(false);
            setSelectedNonCredentialedUsers([]);

            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the members
            setCount(count + 1);
        }
    };

    /**
     * @name deleteUser
     * @param user
     */
    const deleteUser = async (user) => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.deleteTeamUser(user);

            if (!response) {
                return;
            }

            notification.add({
                color: 'success',
                message: `Successfully removed user`,
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setDeleteMemberModal(false);
            setCount(count + 1);
        }
        // refresh the members
    };

    /**
     * @name deleteTeamUsers
     * @param user
     */
    const deleteTeamUsers = async () => {
        try {
            for (let i = 0; i < selectedMembers.length; i++) {
                try {
                    let response: AxiosResponse<{ success: boolean }> | null =
                        null;
                    response = await monolithStore.deleteTeamUser(
                        selectedMembers[i],
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
                    setDeleteMemberModal(false);
                }
            }
        } finally {
            notification.add({
                color: 'success',
                message: `Successfully removed users`,
            });
            setCount(count + 1);
            setDeleteMembersModal(false);
            setSelectedMembers([]);
        }
    };

    /** ADD MEMBER FUNCTIONS */
    /**
     * @name getUsersNonGroup
     * @desc Gets all users without credentials
     */
    const getUsersNonGroup = async () => {
        try {
            let response;
            // possibly add more db table columns / keys here to get id type for display under username
            // eslint-disable-next-line prefer-const
            response = await monolithStore.getNonTeamUsers(groupId);

            // ignore if there is no response
            if (response) {
                const users = response.map((val) => {
                    return {
                        ...val,
                        color: colors[
                            Math.floor(Math.random() * colors.length)
                        ],
                    };
                });

                setNonCredentialedUsers(users);
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setAddMembersModal(true);
        }
    };

    /** HELPERS */
    const Avatars = useMemo(() => {
        if (!teamMembers) return [];

        let i = 0;
        const avatarList = [];
        while (i < 5 && i < teamMembers.length) {
            avatarList.push(
                <Avatar key={i}>
                    {teamMembers[i].name.charAt(0).toUpperCase()}
                </Avatar>,
            );

            i++;
        }

        return avatarList;
    }, [teamMembers]);

    const paginationOptions = {
        membersPageCounts: [5],
    };

    teamMembers > 9 && paginationOptions.membersPageCounts.push(10);
    teamMembers > 19 && paginationOptions.membersPageCounts.push(20);

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
                .getTeamUsers(
                    groupId,
                    limit,
                    membersPage * limit - limit, // offset
                    searchFilter,
                )
                .then((data) => {
                    setTeamMembers(data);
                    setHasMembers(true);
                });
            monolithStore
                .getTeamUsers(
                    groupId,
                    100,
                    0, // offset
                    searchFilter,
                )
                .then((data) => setMemberCount(data.length));
        },
        [count, membersPage, searchFilter],
        200,
    );

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                {(teamMembers && teamMembers.length > 0) ||
                memberCount > 0 ||
                hasMembers ? (
                    <StyledTableContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>Members</StyledTableTitleDiv>
                            <StyledTableTitleMemberContainer>
                                {Avatars.length > 0 ? (
                                    <StyledAvatarGroupContainer>
                                        <AvatarGroup
                                            spacing={'small'}
                                            variant={'circular'}
                                            max={4}
                                            total={
                                                teamMembers &&
                                                teamMembers.length
                                            }
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
                                            {teamMembers.length} Members
                                        </Typography>
                                    </StyledTableTitleMemberCount>
                                </StyledTableTitleMemberCountContainer>
                            </StyledTableTitleMemberContainer>

                            <StyledSearchButtonContainer>
                                <Search
                                    ref={memberSearchRef}
                                    placeholder="Search Members"
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
                                        getUsersNonGroup();
                                    }}
                                >
                                    Add Members{' '}
                                </Button>
                            </StyledAddMemberContainer>
                        </StyledTableTitleContainer>
                        <StyledMemberTable>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell size="small" padding="checkbox">
                                        <Checkbox
                                            checked={
                                                selectedMembers.length ===
                                                    teamMembers.length &&
                                                teamMembers.length > 0
                                            }
                                            onChange={() => {
                                                if (
                                                    selectedMembers.length !==
                                                    teamMembers.length
                                                ) {
                                                    setSelectedMembers(
                                                        teamMembers,
                                                    );
                                                } else {
                                                    setSelectedMembers([]);
                                                }
                                            }}
                                        />
                                    </Table.Cell>
                                    <Table.Cell size="small">Name</Table.Cell>
                                    <StyledEmptyTableCell />
                                    <Table.Cell size="small">
                                        Added Date
                                    </Table.Cell>
                                    <Table.Cell size="small">Action</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {teamMembers &&
                                    teamMembers.map((x, i) => {
                                        const user = teamMembers[i];

                                        let isSelected = false;

                                        if (user) {
                                            isSelected = selectedMembers.some(
                                                (value) => {
                                                    return (
                                                        value.userid ===
                                                        user.userid
                                                    );
                                                },
                                            );
                                        }
                                        if (user) {
                                            return (
                                                <Table.Row key={user.name + i}>
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
                                                                    const selMembers =
                                                                        [];
                                                                    selectedMembers.forEach(
                                                                        (u) => {
                                                                            if (
                                                                                u.userid !==
                                                                                user.userid
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
                                                    </StyledTableCell>
                                                    <UserInfoTableCell
                                                        size="medium"
                                                        component="td"
                                                        scope="row"
                                                    >
                                                        <AvatarWrapper>
                                                            <Avatar>
                                                                {user.name[0].toUpperCase()}
                                                            </Avatar>
                                                        </AvatarWrapper>
                                                        <NameIDWrapper>
                                                            <Stack>
                                                                {user.name}
                                                            </Stack>
                                                            <Stack>
                                                                {`${user.type} ID: ${user.userid}`}
                                                            </Stack>
                                                        </NameIDWrapper>
                                                    </UserInfoTableCell>
                                                    <Table.Cell />
                                                    <Table.Cell size="medium">
                                                        {user.dateadded}
                                                    </Table.Cell>
                                                    <Table.Cell size="medium">
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
                                            paginationOptions.membersPageCounts
                                        }
                                        onPageChange={(e, v) => {
                                            setMembersPage(v + 1);
                                            setSelectedMembers([]);
                                        }}
                                        page={membersPage - 1}
                                        rowsPerPage={5}
                                        count={memberCount}
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
                                    getUsersNonGroup();
                                }}
                            >
                                Add Members{' '}
                            </Button>
                        </StyledNoMembersDiv>
                    </StyledNoMembersContainer>
                )}
            </StyledMemberInnerContent>
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
                        disabled={selectedNonCredentialedUsers.length < 1}
                        onClick={() => {
                            submitNonGroupUsers();
                        }}
                    >
                        Save
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
                                This will remove <b>{userToDelete.name}</b>
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
                            deleteUser(userToDelete);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
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
                            deleteTeamUsers();
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledMemberContent>
    );
};
