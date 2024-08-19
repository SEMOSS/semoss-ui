import { useEffect, useState } from 'react';
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
import { ALL_TYPES } from '@/types';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_ROLE, SETTINGS_PENDING_USER } from './settings.types';

const StyledMemberLoading = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '160px',
}));

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

const StyledTableRow = styled(Table.Row)({
    backgroundColor: '#FFF',
});

const StyledMemberTable = styled(Table)({});

const StyledTableTitleContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'white',
}));

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

const StyledNoPendingReqs = styled('div')(({ theme }) => ({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    justifyContent: 'center',
    alignItems: 'center',
}));

interface PendingMemberTableProps {
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

export const PendingMembersTable = (props: PendingMemberTableProps) => {
    const { id, type, onChange = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [renderedMembers, setRenderedMembers] = useState<
        SETTINGS_PENDING_USER[]
    >([]);
    const [selectedMembers, setSelectedMembers] = useState<
        Record<string, true>
    >({});
    const [openTable, setOpenTable] = useState(false);

    const pendingUserAccessPixel =
        type === 'DATABASE' ||
        type === 'STORAGE' ||
        type === 'MODEL' ||
        type === 'VECTOR' ||
        type === 'FUNCTION'
            ? `GetEngineUserAccessRequest(engine='${id}');`
            : type === 'APP'
            ? `GetProjectUserAccessRequest(project='${id}')`
            : '';

    // Pending Member Requests Pixel call
    const pendingUserAccess = usePixel<SETTINGS_PENDING_USER[]>(
        pendingUserAccessPixel,
    );

    // track if the page is loading
    const isLoading =
        pendingUserAccess.status === 'INITIAL' ||
        pendingUserAccess.status === 'LOADING';

    // set the rendered users
    useEffect(() => {
        if (pendingUserAccess.status !== 'SUCCESS') {
            return;
        }

        const updatedMembers = pendingUserAccess.data.map((m) => ({
            ...m,
            PERMISSION: permissionMapper[m.PERMISSION], // comes in as 1,2,3 -> map to Author, Edit, Read-only
        }));

        setRenderedMembers(updatedMembers);
    }, [pendingUserAccess.status, pendingUserAccess.data]);

    /** API Functions */
    /**
     * @name approvePendingMembers
     * @param members - members to pass to approve api call
     * @description Approve list of Pending Members
     */
    const approvePendingMembers = async (members: SETTINGS_PENDING_USER[]) => {
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
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.approveEngineUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'APP') {
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

            if (response.data.success) {
                const updatedMembers = {
                    ...selectedMembers,
                } as Record<string, true>;

                for (const m of members) {
                    if (updatedMembers[m.ID]) {
                        delete updatedMembers[m.ID];
                    }
                }
                setSelectedMembers(updatedMembers);

                // refresh the data
                pendingUserAccess.refresh();

                // trigger onChange
                onChange();

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
    const denyPendingMembers = async (members: SETTINGS_PENDING_USER[]) => {
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
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.denyEngineUserAccessRequest(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'APP') {
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

            if (response.data.success) {
                const updatedMembers = {
                    ...selectedMembers,
                } as Record<string, true>;

                for (const m of members) {
                    if (updatedMembers[m.ID]) {
                        delete updatedMembers[m.ID];
                    }
                }
                setSelectedMembers(updatedMembers);

                // refresh the data
                pendingUserAccess.refresh();

                // trigger onChange
                onChange();

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
     * @param member
     * @param value
     * @desc Updates pending member permission in radiogroup
     */
    const updatePendingMemberPermission = (
        member: SETTINGS_PENDING_USER,
        role: SETTINGS_ROLE,
    ) => {
        const updatedRenderedMembers = renderedMembers.map((m) => {
            if (member.ID === m.ID) {
                return {
                    ...m,
                    PERMISSION: role,
                };
            }

            return m;
        });

        setRenderedMembers(updatedRenderedMembers);
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
                                        {renderedMembers.length < 2
                                            ? `${renderedMembers.length} pending request`
                                            : `${renderedMembers.length} pending requests`}
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

                        {Object.keys(selectedMembers).length > 0 && (
                            <>
                                <StyledDeleteSelectedContainer>
                                    <Button
                                        variant={'outlined'}
                                        color="error"
                                        onClick={() => {
                                            const members =
                                                renderedMembers.filter(
                                                    (m) =>
                                                        selectedMembers[m.ID],
                                                );

                                            denyPendingMembers(members);
                                        }}
                                    >
                                        Deny Selected
                                    </Button>
                                </StyledDeleteSelectedContainer>
                                <StyledAddMemberContainer>
                                    <Button
                                        variant={'contained'}
                                        onClick={() => {
                                            const members =
                                                renderedMembers.filter(
                                                    (m) =>
                                                        selectedMembers[m.ID],
                                                );

                                            approvePendingMembers(
                                                Object.values(members),
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
                        {isLoading ? (
                            <StyledMemberLoading>
                                <LoadingScreen relative={true}>
                                    <LoadingScreen.Trigger description="Getting members" />
                                </LoadingScreen>
                            </StyledMemberLoading>
                        ) : (
                            <>
                                {renderedMembers.length ? (
                                    <StyledMemberTable>
                                        <Table.Head>
                                            <StyledTableRow>
                                                <Table.Cell
                                                    size="small"
                                                    padding="checkbox"
                                                >
                                                    <Checkbox
                                                        checked={
                                                            Object.keys(
                                                                selectedMembers,
                                                            ).length ===
                                                                renderedMembers.length &&
                                                            renderedMembers.length >
                                                                0
                                                        }
                                                        onChange={() => {
                                                            if (
                                                                Object.keys(
                                                                    selectedMembers,
                                                                ).length !==
                                                                renderedMembers.length
                                                            ) {
                                                                const updatedMembers =
                                                                    renderedMembers.reduce(
                                                                        (
                                                                            acc,
                                                                            val,
                                                                        ) => {
                                                                            acc[
                                                                                val.ID
                                                                            ] =
                                                                                val;

                                                                            return acc;
                                                                        },
                                                                        {},
                                                                    );

                                                                setSelectedMembers(
                                                                    updatedMembers,
                                                                );
                                                            } else {
                                                                setSelectedMembers(
                                                                    {},
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </Table.Cell>
                                                <Table.Cell size="small">
                                                    ID
                                                </Table.Cell>
                                                <Table.Cell size="small">
                                                    Name
                                                </Table.Cell>
                                                <Table.Cell size="small">
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection:
                                                                'row',
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
                                            {renderedMembers.map(
                                                (member, i) => {
                                                    const isSelected =
                                                        !!selectedMembers[
                                                            member.ID
                                                        ];

                                                    return (
                                                        <StyledTableRow key={i}>
                                                            <Table.Cell>
                                                                <Checkbox
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onChange={() => {
                                                                        // update selected members
                                                                        const updatedMembers =
                                                                            {
                                                                                ...selectedMembers,
                                                                            } as Record<
                                                                                string,
                                                                                true
                                                                            >;

                                                                        if (
                                                                            isSelected
                                                                        ) {
                                                                            delete updatedMembers[
                                                                                member
                                                                                    .ID
                                                                            ];
                                                                        } else {
                                                                            updatedMembers[
                                                                                member.ID
                                                                            ] =
                                                                                true;
                                                                        }

                                                                        setSelectedMembers(
                                                                            updatedMembers,
                                                                        );
                                                                    }}
                                                                />
                                                            </Table.Cell>
                                                            <Table.Cell
                                                                component="td"
                                                                scope="row"
                                                            >
                                                                {
                                                                    member.REQUEST_USERID
                                                                }
                                                            </Table.Cell>
                                                            <Table.Cell
                                                                component="td"
                                                                scope="row"
                                                            >
                                                                {member.NAME}
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                {
                                                                    member.REQUEST_TIMESTAMP
                                                                }
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                <RadioGroup
                                                                    row
                                                                    value={
                                                                        member.PERMISSION
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const val =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        if (
                                                                            val
                                                                        ) {
                                                                            updatePendingMemberPermission(
                                                                                member,
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
                                                                            [
                                                                                member,
                                                                            ],
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
                                                                            [
                                                                                member,
                                                                            ],
                                                                        );
                                                                    }}
                                                                >
                                                                    <Close />
                                                                </IconButton>
                                                            </Table.Cell>
                                                        </StyledTableRow>
                                                    );
                                                },
                                            )}
                                        </Table.Body>
                                    </StyledMemberTable>
                                ) : (
                                    <StyledNoPendingReqs>
                                        <Typography variant={'body2'}>
                                            No requests pending
                                        </Typography>
                                    </StyledNoPendingReqs>
                                )}
                            </>
                        )}
                    </Collapse>
                </StyledTableContainer>
            </StyledMemberInnerContent>
        </StyledMemberContent>
    );
};
