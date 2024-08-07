import { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';
import {
    styled,
    Button,
    Checkbox,
    Table,
    IconButton,
    AvatarGroup,
    Avatar,
    RadioGroup,
    Typography,
    Search,
    Stack,
    useNotification,
} from '@semoss/ui';
import { Delete } from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { ALL_TYPES } from '@/types';
import { useRootStore, useAPI, useSettings, useDebounceValue } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { SETTINGS_PROVISIONED_USER } from './settings.types';

import { MembersDeleteOverlay } from './MembersDeleteOverlay';
import { MembersAddOverlay } from './MembersAddOverlay';

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

const StyledNoMembersDiv = styled('div')(({ theme }) => ({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    justifyContent: 'center',
    alignItems: 'center',
}));

const StyledTableCell = styled(Table.Cell)({
    paddingLeft: '16px',
});

const StyledCheckbox = styled(Checkbox)({
    paddingBottom: '0px',
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

interface MembersTableProps {
    /**
     * Id of the engine
     */
    id: string;

    /**
     * Type of the engine
     */
    type: ALL_TYPES;

    /**
     * Called when permissions are changed
     */
    onChange?: () => void;
}

export const MembersTable = (props: MembersTableProps) => {
    const { id, type, onChange = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    /** Member Table State */
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [search, setSearch] = useState<string>('');
    const [permissionFilter, setPermissionFilter] = useState<string>('');
    const [selectedMembers, setSelectedMembers] = useState<
        SETTINGS_PROVISIONED_USER[]
    >([]);

    // debounce the input
    const debouncedSearch = useDebounceValue(search);

    /** Delete Member */
    const [deleteMembersModal, setDeleteMembersModal] =
        useState<boolean>(false);
    const [pendingDeletedMembers, setPendingDeletedMembers] = useState<
        SETTINGS_PROVISIONED_USER[]
    >([]);

    /** Add Member State */
    const [addMembersModal, setAddMembersModal] = useState<boolean>(false);

    const memberSearchRef = useRef(undefined);

    // get the api
    const getMembersApi: Parameters<typeof useAPI>[0] =
        type === 'DATABASE' ||
        type === 'STORAGE' ||
        type === 'MODEL' ||
        type === 'VECTOR' ||
        type === 'FUNCTION'
            ? [
                  'getEngineUsers',
                  adminMode,
                  id,
                  debouncedSearch ? debouncedSearch : undefined,
                  permissionMapper[permissionFilter],
                  (page + 1) * rowsPerPage - rowsPerPage, // offset
                  rowsPerPage, // limit
              ]
            : type === 'APP'
            ? [
                  'getProjectUsers',
                  adminMode,
                  id,
                  debouncedSearch ? debouncedSearch : undefined,
                  permissionMapper[permissionFilter],
                  (page + 1) * rowsPerPage - rowsPerPage, // offset
                  rowsPerPage, // limit
              ]
            : null;

    const getMembers = useAPI(getMembersApi);

    /**
     * When
     **/
    useEffect(() => {
        if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
            return;
        }

        setPage(0);
        setSelectedMembers([]);

        // select the member when done mounting
        memberSearchRef.current?.focus();
    }, [getMembers.status, getMembers.data]);

    // useLayoutEffect(() => {
    //     if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
    //         return;
    //     }

    //     // select the member when done mounting
    //     memberSearchRef.current?.focus();
    // }, [getMembers.status, getMembers.data]);

    /**
     * Update the selected users
     * @param members
     * @param quickUpdate
     * @returns
     */
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
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.editEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'APP') {
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

                // refresh the members
                getMembers.refresh();

                onChange();
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
     * Open the delete modal
     *
     * @param members - members that will be deleted
     */
    const openDeleteMembersModal = (members: SETTINGS_PROVISIONED_USER[]) => {
        // notify if no members
        if (members.length === 0) {
            notification.add({
                color: 'warning',
                message: `No permissions to change`,
            });

            return;
        }

        // set the pending members
        setPendingDeletedMembers(members);

        // close the model
        setDeleteMembersModal(true);
    };

    /**
     * Open the add modal
     */
    const openAddMembersModal = () => {
        // close the model
        setAddMembersModal(true);
    };

    // track if the page is loading
    const isLoading =
        getMembers.status === 'INITIAL' || getMembers.status === 'LOADING';
    const renderedMembers =
        getMembers.status === 'SUCCESS' ? getMembers.data['members'] : [];
    const totalMembers =
        getMembers.status === 'SUCCESS' ? getMembers.data['totalMembers'] : 0;
    const hasMembers =
        getMembers.status === 'SUCCESS' && getMembers.data['totalMembers'] > 0;

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
                                        total={totalMembers}
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
                                        {totalMembers} Members
                                    </Typography>
                                </StyledTableTitleMemberCount>
                            </StyledTableTitleMemberCountContainer>
                        </StyledTableTitleMemberContainer>

                        <StyledSearchButtonContainer>
                            <Search
                                inputRef={memberSearchRef}
                                placeholder="Search Members"
                                size="small"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                }}
                            />
                        </StyledSearchButtonContainer>

                        <StyledDeleteSelectedContainer>
                            {selectedMembers.length > 0 && (
                                <Button
                                    disabled={isLoading}
                                    variant={'outlined'}
                                    color="error"
                                    onClick={() =>
                                        openDeleteMembersModal(selectedMembers)
                                    }
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
                                    openAddMembersModal();
                                }}
                            >
                                Add Members
                            </Button>
                        </StyledAddMemberContainer>
                    </StyledTableTitleContainer>

                    {isLoading ? (
                        <StyledMemberLoading>
                            <LoadingScreen relative={true}>
                                <LoadingScreen.Trigger description="Getting members" />
                            </LoadingScreen>
                        </StyledMemberLoading>
                    ) : (
                        <>
                            {hasMembers ? (
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
                                                Permission
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                Permission Date
                                            </Table.Cell>
                                            <Table.Cell size="small">
                                                &nbsp;
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {renderedMembers.map((x, i) => {
                                            const user = renderedMembers[i];

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
                                            }

                                            if (user) {
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
                                                                    {`${user.type} ID: ${user.id}`}
                                                                </Stack>
                                                            </NameIDWrapper>
                                                        </UserInfoTableCell>
                                                        <Table.Cell size="medium">
                                                            <RadioGroup
                                                                row
                                                                defaultValue={
                                                                    permissionMapper[
                                                                        user
                                                                            .permission
                                                                    ]
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    updateSelectedUsers(
                                                                        [user],
                                                                        permissionMapper[
                                                                            e
                                                                                .target
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
                                                        <Table.Cell size="medium">
                                                            Not Available
                                                        </Table.Cell>
                                                        <Table.Cell size="medium">
                                                            <IconButton
                                                                onClick={() => {
                                                                    openDeleteMembersModal(
                                                                        [user],
                                                                    );
                                                                }}
                                                            >
                                                                <Delete></Delete>
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
                                                    setSelectedMembers([]);
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
                                                count={totalMembers}
                                            />
                                        </Table.Row>
                                    </Table.Footer>
                                </StyledMemberTable>
                            ) : (
                                <StyledNoMembersDiv>
                                    <Typography variant={'body2'}>
                                        No members
                                    </Typography>
                                    <Button
                                        disabled={isLoading}
                                        variant={'contained'}
                                        onClick={() => {
                                            openAddMembersModal();
                                        }}
                                    >
                                        Add Members
                                    </Button>
                                </StyledNoMembersDiv>
                            )}
                        </>
                    )}
                </StyledTableContainer>
            </StyledMemberInnerContent>
            <MembersDeleteOverlay
                type={type}
                id={id}
                members={pendingDeletedMembers}
                open={deleteMembersModal}
                onClose={(success) => {
                    // clear out the deleted members
                    setPendingDeletedMembers([]);

                    // close the model
                    setDeleteMembersModal(false);

                    // refresh if successful
                    if (success) {
                        // trigger the update
                        onChange();

                        // refresh
                        getMembers.refresh();
                    }
                }}
            />
            <MembersAddOverlay
                type={type}
                id={id}
                open={addMembersModal}
                onClose={(success) => {
                    // clear out the deleted members
                    setAddMembersModal(false);

                    // refresh if successful
                    if (success) {
                        // trigger the update
                        onChange();

                        getMembers.refresh();
                    }
                }}
            />
        </StyledMemberContent>
    );
};
