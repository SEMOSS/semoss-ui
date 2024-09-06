import { useMemo, useRef, useState } from 'react';
import { Delete, Edit } from '@mui/icons-material';
import {
    styled,
    useNotification,
    Button,
    Checkbox,
    Typography,
    AvatarGroup,
    Avatar,
    Table,
    IconButton,
    Search,
} from '@semoss/ui';
import { useRootStore, useAPI, useSettings, useDebounceValue } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { UserAddOverlay } from './UserAddOverlay';
import { UserTableUser } from './UserTableUser';

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

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
    borderRadius: '12px',
    border: `1px solid ${theme.palette.secondary.border}`,
}));

const StyledMemberLoading = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '160px',
}));

const StyledMemberTable = styled(Table)({
    backgroundColor: 'white',
});

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

const StyledAddMemberContainer = styled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledNoUsersDiv = styled('div')(({ theme }) => ({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    justifyContent: 'center',
    alignItems: 'center',
}));

interface User {
    id: string;
    type: string;
    name?: string;
    admin?: boolean;
    publisher?: boolean;
    exporter?: boolean;
    email?: string;
    phone?: string;
    phoneextension?: string;
    countrycode?: string;
    username?: string;
}

interface UserTableProps {
    /**
     * Called users are changed
     */
    onChange?: () => void;
}

export const UserTable = (props: UserTableProps) => {
    const { onChange = () => null } = props;

    const { adminMode } = useSettings();
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [search, setSearch] = useState<string>('');

    // debounce the input
    const debouncedSearch = useDebounceValue(search);

    /** Add User State */
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const [addModalUser, setAddModalUser] = useState<User | null>(null);

    const userSearchRef = useRef(undefined);

    const getUsers = useAPI([
        'getAllUsers',
        adminMode,
        debouncedSearch ? debouncedSearch : '',
        (page + 1) * rowsPerPage - rowsPerPage, // offset
        rowsPerPage, // limit
    ]);

    // track if the page is loading
    const isLoading =
        getUsers.status === 'INITIAL' || getUsers.status === 'LOADING';
    const renderedUsers = getUsers.status === 'SUCCESS' ? getUsers.data : [];
    const totalUsers = getUsers.status === 'SUCCESS' ? 0 : 0;
    const hasUsers = getUsers.status === 'SUCCESS' && getUsers.data.length > 0;
    /**
     * Update a user
     * @param user - user to update
     */
    const updateUser = async (user: User) => {
        try {
            const response = await monolithStore.editMemberInfo(
                adminMode,
                user,
            );

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully updated user',
                });

                onChange();

                // refresh the users
                getUsers.refresh();
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing user`,
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
     * Delate a user info
     * @param user - user to update
     */
    const deleteUser = async (user: User) => {
        try {
            const response = await monolithStore.deleteMember(
                adminMode,
                user.id,
                user.type,
            );

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully deleting user',
                });

                onChange();

                // refresh the users
                getUsers.refresh();
            } else {
                notification.add({
                    color: 'error',
                    message: `Error deleting user`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

    // Avatars rendered
    const Avatars = useMemo(() => {
        if (!renderedUsers.length) {
            return [];
        }

        let i = 0;
        const avatarList = [];
        while (i < 5 && i < renderedUsers.length) {
            avatarList.push(
                <Avatar key={i}>
                    {(renderedUsers[i].name || ' ').charAt(0).toUpperCase()}
                </Avatar>,
            );

            i++;
        }

        return avatarList;
    }, [renderedUsers.length]);

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>Users</Typography>
                        </StyledTableTitleDiv>
                        <StyledTableTitleMemberContainer>
                            {Avatars.length > 0 ? (
                                <StyledAvatarGroupContainer>
                                    <AvatarGroup
                                        spacing={'small'}
                                        variant={'circular'}
                                        max={4}
                                        total={totalUsers}
                                    >
                                        {Avatars.map((el) => {
                                            return el;
                                        })}
                                    </AvatarGroup>
                                </StyledAvatarGroupContainer>
                            ) : null}
                            <StyledTableTitleMemberCountContainer>
                                <StyledTableTitleMemberCount>
                                    <Typography variant={'caption'}>
                                        {totalUsers} Users
                                    </Typography>
                                </StyledTableTitleMemberCount>
                            </StyledTableTitleMemberCountContainer>
                        </StyledTableTitleMemberContainer>

                        <StyledSearchButtonContainer>
                            <Search
                                inputRef={userSearchRef}
                                placeholder="Search Users"
                                size="small"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                }}
                            />
                        </StyledSearchButtonContainer>

                        <StyledAddMemberContainer>
                            <Button
                                disabled={isLoading}
                                variant={'contained'}
                                onClick={() => {
                                    // open the modal to a new user
                                    setAddModalOpen(true);
                                    setAddModalUser(null);
                                }}
                            >
                                Add User
                            </Button>
                        </StyledAddMemberContainer>
                    </StyledTableTitleContainer>

                    {isLoading ? (
                        <StyledMemberLoading>
                            <LoadingScreen relative={true}>
                                <LoadingScreen.Trigger description="Getting users" />
                            </LoadingScreen>
                        </StyledMemberLoading>
                    ) : (
                        <>
                            {hasUsers ? (
                                <StyledMemberTable>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell size="small">
                                                User
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Role
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                &nbsp;
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {renderedUsers.map((user) => {
                                            if (user) {
                                                return (
                                                    <Table.Row key={user.id}>
                                                        <Table.Cell>
                                                            <UserTableUser
                                                                id={user.id}
                                                                name={user.name}
                                                                email={
                                                                    user.email
                                                                }
                                                                type={user.type}
                                                            />
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Checkbox
                                                                label="Publisher"
                                                                checked={
                                                                    user.publisher
                                                                }
                                                                onChange={() => {
                                                                    updateUser({
                                                                        ...user,
                                                                        publisher:
                                                                            !user.publisher,
                                                                    });
                                                                }}
                                                            />
                                                            <Checkbox
                                                                label="Exporter"
                                                                checked={
                                                                    user.exporter
                                                                }
                                                                onChange={() => {
                                                                    updateUser({
                                                                        ...user,
                                                                        exporter:
                                                                            !user.exporter,
                                                                    });
                                                                }}
                                                            />
                                                            <Checkbox
                                                                label="Admin"
                                                                checked={
                                                                    user.admin
                                                                }
                                                                onChange={() => {
                                                                    updateUser({
                                                                        ...user,
                                                                        admin: !user.admin,
                                                                    });
                                                                }}
                                                            />
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <IconButton
                                                                onClick={() => {
                                                                    setAddModalOpen(
                                                                        true,
                                                                    );

                                                                    setAddModalUser(
                                                                        user,
                                                                    );
                                                                }}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => {
                                                                    deleteUser(
                                                                        user,
                                                                    );
                                                                }}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            }

                                            return null;
                                        })}
                                    </Table.Body>
                                    <Table.Footer>
                                        <Table.Row>
                                            <Table.Pagination
                                                disabled={isLoading}
                                                onPageChange={(e, v) => {
                                                    setPage(v);
                                                }}
                                                page={page}
                                                rowsPerPage={rowsPerPage}
                                                rowsPerPageOptions={[5, 10, 20]}
                                                onRowsPerPageChange={(e) => {
                                                    // set the new limit
                                                    setRowsPerPage(
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ),
                                                    );
                                                }}
                                                count={totalUsers}
                                            />
                                        </Table.Row>
                                    </Table.Footer>
                                </StyledMemberTable>
                            ) : (
                                <StyledNoUsersDiv>
                                    <Typography variant={'body2'}>
                                        No users
                                    </Typography>
                                    <Button
                                        disabled={isLoading}
                                        variant={'contained'}
                                        onClick={() => {
                                            // open the modal to a new user
                                            setAddModalOpen(true);
                                            setAddModalUser(null);
                                        }}
                                    >
                                        Add User
                                    </Button>
                                </StyledNoUsersDiv>
                            )}
                        </>
                    )}
                </StyledTableContainer>
            </StyledMemberInnerContent>

            <UserAddOverlay
                user={addModalUser}
                open={addModalOpen}
                onClose={(success) => {
                    // close it
                    setAddModalOpen(false);

                    // de-select the user
                    setAddModalUser(null);

                    // refresh if successful
                    if (success) {
                        // trigger the update
                        onChange();

                        getUsers.refresh();
                    }
                }}
            />
        </StyledMemberContent>
    );
};
