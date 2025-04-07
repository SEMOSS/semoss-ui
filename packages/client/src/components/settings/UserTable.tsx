import { useEffect, useMemo, useRef, useState } from 'react';
import { Add, Delete, Edit } from '@mui/icons-material';
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
    Box,
    Stack,
} from '@semoss/ui';
import { useRootStore, useAPI, useSettings, useDebounceValue } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { UserAddOverlay } from './UserAddOverlay';
import SearchIcon from '@mui/icons-material/Search';

const AvatarWrapper = styled('div')({
    display: 'inline-block',
    width: '50px',
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

const StyledPrimaryText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

const StyledSecondaryText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

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

const StyledTableCell = styled(Table.Cell)({
    paddingLeft: '16px',
});

const StyledCheckbox = styled(Checkbox)({
    paddingBottom: '0px',
});

const StyledCenteredBox = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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

const formatValue = (input: string) => {
    if (input !== undefined) {
        const mappings: Record<string, string> = {
            TOKEN: 'Token',
            COMPUTE: 'Compute time',
            DAY: 'Daily',
            WEEK: 'Weekly',
            MONTH: 'Monthly',
        };
        return mappings[input.toUpperCase()] || input;
    }
    return '';
};

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
    model_usage_restriction?: string;
    model_usage_frequency?: string;
    model_max_tokens?: number;
    model_max_response_time?: number;
    unit?: string;
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
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // debounce the input
    const debouncedSearch = useDebounceValue(search);

    /** Member Table State */
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [count, setCount] = useState(0);

    /** Add User State */
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const [addModalUser, setAddModalUser] = useState<User | null>(null);

    const userSearchRef = useRef(undefined);

    const getUsers = useAPI([
        'getAllUsers',
        adminMode,
        debouncedSearch ? debouncedSearch : '',
        (page + 1) * rowsPerPage - rowsPerPage, // offset
        count, // limit
    ]);

    // track if the page is loading
    const isLoading =
        getUsers.status === 'INITIAL' || getUsers.status === 'LOADING';
    const renderedMembers =
        getUsers.status === 'SUCCESS' ? getUsers.data['users'] : [];
    const totalUsers =
        getUsers.status === 'SUCCESS' ? getUsers.data['totalUsers'] : 0;
    const hasUsers =
        getUsers.status === 'SUCCESS' && getUsers.data['totalUsers'] > 0;

    /**
     * Update a user
     * @param user - user to update
     */
    const updateUser = async (user: User) => {
        try {
            if (user.exporter === undefined || user.publisher === undefined) {
                if (user.exporter) {
                    user.publisher = false;
                } else if (user.publisher) {
                    user.exporter = false;
                } else {
                    user.publisher = false;
                    user.exporter = false;
                }
            }
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

    /**
     * @name deleteUsers
     */
    const deleteUsers = async () => {
        try {
            for (let i = 0; i < selectedMembers.length; i++) {
                try {
                    const response = await monolithStore.deleteMember(
                        adminMode,
                        selectedMembers[i].id,
                        selectedMembers[i].type,
                    );

                    if (!response) {
                        return;
                    }

                    // ignore if there is no response
                    if (response.data) {
                        notification.add({
                            color: 'success',
                            message: 'Successfully deleted users',
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
            }
        } finally {
            setCount(count + 1);
            setSelectedMembers([]);
        }
    };

    // Avatars rendered
    const Avatars = useMemo(() => {
        if (!renderedMembers.length) {
            return [];
        }

        let i = 0;
        const avatarList = [];
        while (i < 5 && i < renderedMembers.length) {
            avatarList.push(
                <Avatar key={i}>
                    {(renderedMembers[i].name || ' ').charAt(0).toUpperCase()}
                </Avatar>,
            );

            i++;
        }

        return avatarList;
    }, [renderedMembers.length]);

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>Members</Typography>
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
                                        {totalUsers} Members
                                    </Typography>
                                </StyledTableTitleMemberCount>
                            </StyledTableTitleMemberCountContainer>
                        </StyledTableTitleMemberContainer>
                        <StyledSearchButtonContainer>
                            {isSearch ? (
                                <Search
                                    inputRef={userSearchRef}
                                    placeholder="Search Users"
                                    size="small"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                    }}
                                />
                            ) : (
                                <IconButton
                                    onClick={() => setIsSearch(!isSearch)}
                                >
                                    <SearchIcon />
                                </IconButton>
                            )}
                        </StyledSearchButtonContainer>
                        <StyledDeleteSelectedContainer>
                            {selectedMembers.length > 0 && (
                                <Button
                                    variant={'outlined'}
                                    color="primary"
                                    onClick={() => deleteUsers()}
                                >
                                    Delete Selected
                                </Button>
                            )}
                        </StyledDeleteSelectedContainer>
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
                                <StyledCenteredBox>
                                    <Add />
                                    Add Members
                                </StyledCenteredBox>
                            </Button>
                        </StyledAddMemberContainer>
                    </StyledTableTitleContainer>

                    {isLoading ? (
                        <StyledMemberLoading>
                            <LoadingScreen relative={true}>
                                <LoadingScreen.Trigger description="Getting Members" />
                            </LoadingScreen>
                        </StyledMemberLoading>
                    ) : (
                        <>
                            {hasUsers ? (
                                <StyledMemberTable>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell
                                                size="small"
                                                padding="checkbox"
                                            >
                                                <Checkbox
                                                    checked={
                                                        selectedMembers.length ===
                                                            renderedMembers.length &&
                                                        renderedMembers.length >
                                                            0
                                                    }
                                                    onChange={() => {
                                                        if (
                                                            selectedMembers.length !==
                                                            renderedMembers.length
                                                        ) {
                                                            setSelectedMembers(
                                                                renderedMembers,
                                                            );
                                                        } else {
                                                            setSelectedMembers(
                                                                [],
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Name
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Email
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Type
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Model Limit Type
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Limit Value
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Frequency
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Role
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Actions
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {renderedMembers.map((user) => {
                                            let isSelected = false;
                                            if (user) {
                                                isSelected =
                                                    selectedMembers.some(
                                                        (value) => {
                                                            return (
                                                                value.id ===
                                                                user.id
                                                            );
                                                        },
                                                    );
                                                return (
                                                    <Table.Row key={user.id}>
                                                        <StyledTableCell
                                                            size="medium"
                                                            padding="checkbox"
                                                        >
                                                            <StyledCheckbox
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onChange={() => {
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        const selMembers =
                                                                            [];
                                                                        selectedMembers.forEach(
                                                                            (
                                                                                u,
                                                                            ) => {
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
                                                        </StyledTableCell>
                                                        <Table.Cell>
                                                            <StyledCenteredBox>
                                                                <AvatarWrapper>
                                                                    <Avatar>
                                                                        {user.name[0].toUpperCase()}
                                                                    </Avatar>
                                                                </AvatarWrapper>
                                                                <Stack
                                                                    direction={
                                                                        'column'
                                                                    }
                                                                    spacing={0}
                                                                    flex={1}
                                                                >
                                                                    <StyledPrimaryText
                                                                        variant="body1"
                                                                        noWrap={
                                                                            true
                                                                        }
                                                                        title={`Name: ${user.name}`}
                                                                    >
                                                                        {user.name || (
                                                                            <>
                                                                                &nbsp;
                                                                            </>
                                                                        )}
                                                                    </StyledPrimaryText>
                                                                    <Stack
                                                                        direction={
                                                                            'row'
                                                                        }
                                                                        alignItems={
                                                                            'center'
                                                                        }
                                                                        spacing={
                                                                            1
                                                                        }
                                                                        width={
                                                                            '150px'
                                                                        }
                                                                        title={`Id: ${user.id}`}
                                                                    >
                                                                        <StyledSecondaryText
                                                                            variant="body2"
                                                                            noWrap={
                                                                                true
                                                                            }
                                                                        >
                                                                            ID:
                                                                        </StyledSecondaryText>
                                                                        <StyledPrimaryText
                                                                            variant="body2"
                                                                            noWrap={
                                                                                true
                                                                            }
                                                                        >
                                                                            {user.id || (
                                                                                <>
                                                                                    &nbsp;
                                                                                </>
                                                                            )}
                                                                        </StyledPrimaryText>
                                                                    </Stack>
                                                                </Stack>
                                                            </StyledCenteredBox>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {user.email}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {user.type}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {formatValue(
                                                                user?.model_usage_restriction,
                                                            )}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {user?.model_usage_restriction ===
                                                                'compute' &&
                                                                `${user?.model_max_response_time?.toLocaleString()} ms`}

                                                            {user?.model_usage_restriction ===
                                                                'token' &&
                                                                `${user?.model_max_tokens?.toLocaleString()}`}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {formatValue(
                                                                user?.model_usage_frequency,
                                                            )}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <StyledCenteredBox>
                                                                <Checkbox
                                                                    label="Publisher"
                                                                    checked={
                                                                        user.publisher
                                                                    }
                                                                    onChange={() => {
                                                                        updateUser(
                                                                            {
                                                                                ...user,
                                                                                publisher:
                                                                                    !user.publisher,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                                <Checkbox
                                                                    label="Exporter"
                                                                    checked={
                                                                        user.exporter
                                                                    }
                                                                    onChange={() => {
                                                                        updateUser(
                                                                            {
                                                                                ...user,
                                                                                exporter:
                                                                                    !user.exporter,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                                <Checkbox
                                                                    label="Admin"
                                                                    checked={
                                                                        user.admin
                                                                    }
                                                                    onChange={() => {
                                                                        updateUser(
                                                                            {
                                                                                ...user,
                                                                                admin: !user.admin,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                            </StyledCenteredBox>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <StyledCenteredBox>
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
                                                            </StyledCenteredBox>
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
                                                rowsPerPageOptions={[
                                                    25, 50, 100,
                                                ]}
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
                                        No Members
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
                                        Add Member
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
