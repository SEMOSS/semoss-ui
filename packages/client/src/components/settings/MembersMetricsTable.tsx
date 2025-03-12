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
    useNotification,
    Box,
} from '@semoss/ui';
import { Add, Delete, Edit } from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { ALL_TYPES } from '@/types';
import { useRootStore, useAPI, useSettings, useDebounceValue } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { SETTINGS_PROVISIONED_USER } from './settings.types';

import { MembersDeleteOverlay } from './MembersDeleteOverlay';
import { MembersAddOverlay } from './MembersAddOverlay';
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

const StyledCenteredBox = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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

const formatValue = (input: string) => {
    if (input !== undefined) {
        const mappings: Record<string, string> = {
            TOKEN: 'Token',
            COMPUTE: 'Compute time',
            DAY: 'Daily',
            WEEK: 'Weekly',
            MONTH: 'Monthly',
            NULL: 'None',
        };
        return mappings[input.toUpperCase()] || input;
    }
    return '';
};

interface MembersTableProps {
    /**
     * Called when permissions are changed
     */
    onChange?: () => void;
}

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
export const MembersMetricsTable = (props: MembersTableProps) => {
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    /** Member Table State */
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [search, setSearch] = useState<string>('');
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const [permissionFilter, setPermissionFilter] = useState<string>('');
    const [selectedMembers, setSelectedMembers] = useState([]);

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
    const [addModalUser, setAddModalUser] = useState<User | null>(null);

    const memberSearchRef = useRef(undefined);

    // get the api
    const getMembers = useAPI([
        'getAllUsers',
        adminMode,
        debouncedSearch ? debouncedSearch : '',
        (page + 1) * rowsPerPage - rowsPerPage, // offset
        rowsPerPage, // limit
    ]);

    // const getMembers = useAPI(getMembersApi);

    /**
     * When
     **/
    useEffect(() => {
        if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
            return;
        }

        // setPage(0);
        // setSelectedMembers([]);

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

    // /**
    //  * Update the selected users
    //  * @param members
    //  * @param quickUpdate
    //  * @returns
    //  */
    // const updateSelectedUsers = async (members, quickUpdate) => {
    //     try {
    //         // construct requests for post data
    //         const requests = members.map((m) => {
    //             const json = {
    //                 userid: m.id,
    //                 permission: quickUpdate ? quickUpdate : 'OWNER',
    //             };

    //             // FOR MODELS
    //             if (
    //                 m.max_response_time ||
    //                 m.usage_restriction ||
    //                 m.usage_frequency ||
    //                 m.max_tokens
    //             ) {
    //                 // TODO: WE NEED CONSISTENCY, VERSUS HOW WE RECIEVE FROM BACKEND AND HOW WE SEND
    //                 json['maxResponseTime'] = m.max_response_time;
    //                 json['usageRestriction'] = m.usage_restriction;
    //                 json['usageFrequency'] = m.usage_frequency;
    //                 json['maxTokens'] = m.max_tokens;
    //             }
    //             return json;
    //         });

    //         if (requests.length === 0) {
    //             notification.add({
    //                 color: 'warning',
    //                 message: `No permissions to change`,
    //             });

    //             return;
    //         }

    //         let response: AxiosResponse<{ success: boolean }> | null = null;
    //         if (
    //             type === 'DATABASE' ||
    //             type === 'STORAGE' ||
    //             type === 'MODEL' ||
    //             type === 'VECTOR' ||
    //             type === 'FUNCTION'
    //         ) {
    //             response = await monolithStore.editEngineUserPermissions(
    //                 adminMode,
    //                 id,
    //                 requests,
    //             );
    //         } else if (type === 'APP') {
    //             response = await monolithStore.editProjectUserPermissions(
    //                 adminMode,
    //                 id,
    //                 requests,
    //             );
    //         }

    //         if (!response) {
    //             return;
    //         }

    //         // ignore if there is no response
    //         if (response.data.success) {
    //             notification.add({
    //                 color: 'success',
    //                 message: 'Succesfully updated user permissions',
    //             });

    //             // refresh the members
    //             getMembers.refresh();

    //             onChange();
    //         } else {
    //             notification.add({
    //                 color: 'error',
    //                 message: `Error changing user permissions`,
    //             });
    //         }
    //     } catch (e) {
    //         notification.add({
    //             color: 'error',
    //             message: String(e),
    //         });
    //     }
    // };

    /**
     * Open the delete modal
     *
     * @param members - members that will be deleted
     */
    const openDeleteMembersModal = (members) => {
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
        getMembers.status === 'SUCCESS' ? getMembers.data['users'] : [];
    const totalMembers =
        getMembers.status === 'SUCCESS' ? getMembers.data['totalUsers'] : 0;
    const hasMembers =
        getMembers.status === 'SUCCESS' && getMembers.data['totalUsers'] > 0;

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>
                                Members Metrics
                            </Typography>
                        </StyledTableTitleDiv>
                        <StyledSearchButtonContainer>
                            {/* <StyledSearchButtonContainer>
                            {isSearch ? ( */}
                            <Search
                                inputRef={memberSearchRef}
                                placeholder="Search Metrics"
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
                    </StyledTableTitleContainer>

                    {isLoading ? (
                        <StyledMemberLoading>
                            <LoadingScreen relative={true}>
                                <LoadingScreen.Trigger description="Getting members metrics" />
                            </LoadingScreen>
                        </StyledMemberLoading>
                    ) : (
                        <>
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
                                                    renderedMembers.length > 0
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
                                                        setSelectedMembers([]);
                                                    }
                                                }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            User
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Database
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Queries Executed
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Last time ran
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Query Executed
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Last Login
                                        </Table.Cell>
                                        <Table.Cell size="small">
                                            Query Failed
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {hasMembers ? (
                                        <>
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
                                                        <Table.Row
                                                            key={user.id}
                                                        >
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
                                                                    {user.name}
                                                                </StyledCenteredBox>
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                TestDB
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                5
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                Time Test
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                Test Query
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                Test Date
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                Test Fail Query
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    );
                                                }

                                                return null;
                                            })}
                                        </>
                                    ) : (
                                        <StyledNoMembersDiv>
                                            <Typography variant={'body2'}>
                                                No members
                                            </Typography>
                                        </StyledNoMembersDiv>
                                    )}
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
                        </>
                    )}
                </StyledTableContainer>
            </StyledMemberInnerContent>
        </StyledMemberContent>
    );
};
