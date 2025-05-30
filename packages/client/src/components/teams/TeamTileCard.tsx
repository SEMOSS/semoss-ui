import React, { useMemo, useState, useEffect } from 'react';
import {
    MoreVert,
    DeleteRounded,
    Close,
    ClearRounded,
} from '@mui/icons-material';
import {
    Card,
    Chip,
    Stack,
    Typography,
    styled,
    IconButton,
    Modal,
    useNotification,
    Button,
    Popover,
    MenuList,
    MenuItemTwo,
    Autocomplete,
    Box,
    Avatar,
    Link,
} from '@semoss/ui';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import { useRootStore } from '@/hooks';
import { AxiosResponse } from 'axios';
import { AddTeamModal } from './AddTeamModal';

const colors = [
    'rgba(111, 212, 203, 1)',
    'rgba(195, 165, 240, 1)',
    'rgba(255, 192, 217, 1)',
    'rgba(186, 222, 255, 1)',
    'rgba(79, 36, 155, 1)',
    'rgba(161, 211, 150, 1)',
    'rgba(255, 204, 128, 1)',
    'rgba(128, 222, 234, 1)',
    'rgba(255, 229, 127, 1)',
    'rgba(207, 216, 220, 1)',
];

const StyledTileCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{ bordercolor?: string }>(({ bordercolor = 'rgba(0, 0, 0, 0.6)' }) => ({
    '&:hover': {
        cursor: 'pointer',
    },
    padding: '8px',
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px',
    borderLeft: `solid 10px ${bordercolor}`,
    minWidth: '298px',
    maxWidth: '298px',
    maxHeight: '200px',
}));

const StyledCardDescription = styled(Typography)({
    display: 'block',
    minHeight: '40px',
    maxHeight: '40px',
    maxWidth: '256px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '14px',
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: '20.02px',
    letter: '0.17px',
});

const StyledTitle = styled(Typography)({
    display: 'block',
    minHeight: '24px',
    maxHeight: '24px',
    maxWidth: '350px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '16px',
    lineHeight: '24px',
    letter: '0.15px',
});

const StyledActionContainer = styled(Card.Actions)({
    display: 'flex',
    justifyContent: 'flex-end',
    paddingBottom: '2px',
});

const StyledTagChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
    backgroundColor: '#fff',
}));

const StyledChipContainer = styled('div')({
    paddingTop: '8px',
});

const StyledMoreVert = styled(MoreVert, {
    shouldForwardProp: (prop) => prop !== 'hover',
})<{
    /** Track if the page header is stuck */
    hover: boolean;
}>(({ theme, hover }) => ({
    color: hover ? theme.palette.divider : theme.palette.text.secondary,
}));

const StyledModalContentText = styled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

interface TeamCardProps {
    /** ID of team */
    id: string;

    /** Description of the team */
    description: string;

    /** Type of the team */
    type: string;

    /** Tag of the team */
    tag?: string[] | string;

    /** dispatch function */
    dispatch: (val: { type: string; field: string; value: unknown[] }) => void;

    /** databases to update */
    teams;

    onClick?: (value: string) => void;

    isCustomGroup?: boolean;
}

const StyledModalTitle = styled(Modal.Title)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
}));

export const TeamTileCard = (props: TeamCardProps) => {
    const {
        id,
        description,
        type,
        tag,
        dispatch,
        teams,
        onClick,
        isCustomGroup,
    } = props;
    const AUTOCOMPLETE_OFFSET = 0;
    const AUTOCOMPLETE_LIMIT = 10;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [hover, setHover] = React.useState(false);
    const [deleteModal, setDeleteModal] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [nonCredentialedUsers, setNonCredentialedUsers] = useState([]);
    const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
        useState([]);
    const [searchMemberInput, setSearchMemberInput] = useState<string>('');
    const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
    const [isScrollBottom, setIsScrollBottom] = useState(false);
    const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
    const [count, setCount] = useState(0);
    const [canCollect, setCanCollect] = useState<boolean>(true);
    const [editTeam, setEditTeam] = useState(false);

    const randomColor = useMemo(() => {
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    useEffect(() => {
        if (isScrollBottom) {
            if (canCollect) {
                getAdditionalUsersNonGroup();
            }
        }
    }, [isScrollBottom]);

    useEffect(() => {
        if (addMembersModal) {
            if (searchMemberInput) {
                setSearchLoading(true);
            }
            const timer = setTimeout(() => {
                if (!offset) {
                    getUsersNonGroup(false);
                } else {
                    if (canCollect) {
                        getUsersNonGroup(false);
                    } else {
                        getUsersNonGroup(true);
                    }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [addMembersModal, offset, searchMemberInput]);

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

    const getAdditionalUsersNonGroup = () => {
        setOffset(offset + AUTOCOMPLETE_LIMIT);
    };

    const deleteGroup = () => {
        try {
            monolithStore.deleteTeam(id, type);
            dispatch({
                type: 'field',
                field: 'teams',
                value: [...teams.filter((val) => val.id !== id)],
            });
            notification.add({
                color: 'success',
                message: 'Successfully deleted group',
            });
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: e,
            });
        } finally {
            setDeleteModal(false);
        }
    };

    const handleClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

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
                const response: AxiosResponse<{ success: boolean }> | null =
                    await monolithStore.addTeamUser(
                        id,
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

    const getUsersNonGroup = async (reset: boolean) => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        if (isCustomGroup) {
            try {
                const response = await monolithStore.getNonTeamUsers(
                    id,
                    AUTOCOMPLETE_LIMIT,
                    offset,
                    searchMemberInput,
                );

                // ignore if there is no response
                if (response) {
                    let requests = reset ? [] : nonCredentialedUsers;
                    const users = response.map((val) => {
                        return {
                            ...val,
                            color: colors[
                                Math.floor(Math.random() * colors.length)
                            ],
                        };
                    });
                    requests = requests.concat(users);
                    setNonCredentialedUsers(requests);
                    setCanCollect(users.length === AUTOCOMPLETE_LIMIT);
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
        }
    };

    const open = Boolean(anchorEl);
    const popoverId = open ? 'simple-popover' : undefined;

    return (
        <React.Fragment>
            <StyledTileCard
                onClick={() => onClick(id)}
                bordercolor={randomColor}
            >
                {/* Use Card.Media instead, uses img tag */}
                <Card.Header
                    title={
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '8px',
                            }}
                        >
                            <StyledTitle variant={'body1'}>{id}</StyledTitle>
                        </div>
                    }
                    action={''}
                />
                <Card.Content>
                    <StyledCardDescription variant={'body2'}>
                        {description
                            ? description.replace(/['"]+/g, '')
                            : 'No description available'}
                    </StyledCardDescription>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        minHeight="32px"
                    >
                        <StyledChipContainer>
                            {tag !== undefined &&
                                (Array.isArray(tag) ? (
                                    <>
                                        {tag.map((t, i) => {
                                            if (i <= 3) {
                                                return (
                                                    <StyledTagChip
                                                        maxWidth={
                                                            tag.length === 2
                                                                ? '100px'
                                                                : tag.length ===
                                                                  1
                                                                ? '200px'
                                                                : '75px'
                                                        }
                                                        key={`${id}${i}`}
                                                        label={t}
                                                        variant="filled"
                                                    />
                                                );
                                            }
                                        })}
                                    </>
                                ) : (
                                    <StyledTagChip
                                        key={`${id}0`}
                                        label={tag}
                                        variant="filled"
                                    />
                                ))}
                        </StyledChipContainer>
                    </Stack>
                </Card.Content>
                <StyledActionContainer>
                    <IconButton
                        size={'small'}
                        color="default"
                        onClick={handleClick}
                    >
                        <StyledMoreVert hover={hover} />
                    </IconButton>
                    <Popover
                        id={popoverId}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        // transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuList>
                            {isCustomGroup && (
                                <MenuItemTwo
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClose(e);
                                        setAddMembersModal(true);
                                        getUsersNonGroup(false);
                                    }}
                                >
                                    <Stack direction="row" gap={2}>
                                        <PersonAddIcon />
                                        <div>Add member to team</div>
                                    </Stack>
                                </MenuItemTwo>
                            )}
                            {/* <MenuItemTwo
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose(e);
                                    setEditTeam(true);
                                }}
                            >
                                <Stack direction="row" gap={2}>
                                    <EditIcon />
                                    <div>Edit team</div>
                                </Stack>
                            </MenuItemTwo> */}
                            <MenuItemTwo
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteModal(true);
                                    handleClose(e);
                                }}
                                onMouseOver={() => {
                                    setHover(true);
                                }}
                                onMouseLeave={() => {
                                    setHover(false);
                                }}
                            >
                                <Stack direction="row" gap={2}>
                                    <DeleteRounded
                                        sx={{ color: hover ? 'red' : 'black' }}
                                    />
                                    <div
                                        style={{
                                            color: hover ? 'red' : 'black',
                                        }}
                                    >
                                        Delete team
                                    </div>
                                </Stack>
                            </MenuItemTwo>
                        </MenuList>
                    </Popover>
                </StyledActionContainer>
            </StyledTileCard>
            <Modal open={deleteModal}>
                <StyledModalTitle>
                    <Typography sx={{ color: '#000000DE' }} variant="h6">
                        Delete Team
                    </Typography>
                    <IconButton onClick={() => setDeleteModal(false)}>
                        <Close />
                    </IconButton>
                </StyledModalTitle>
                <Modal.Content>
                    <Typography sx={{ color: '#000000DE' }} variant="body1">
                        Are you sure you want to delete group {id}
                    </Typography>
                </Modal.Content>
                <Modal.Actions
                    sx={{ marginBottom: '24px', paddingRight: '16px' }}
                >
                    <Button
                        onClick={() => setDeleteModal(false)}
                        variant="text"
                        sx={{ color: '#212121' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={'error'}
                        onClick={() => deleteGroup()}
                    >
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={addMembersModal} maxWidth="lg">
                <StyledModalTitle>
                    <Typography sx={{ color: '#000000DE' }} variant="h6">
                        Add Members to Team
                    </Typography>
                    <IconButton onClick={() => setAddMembersModal(false)}>
                        <Close />
                    </IconButton>
                </StyledModalTitle>
                <Modal.Content sx={{ width: '50rem' }}>
                    <StyledModalContentText>
                        <Autocomplete
                            label="Search"
                            loading={isLoading || searchLoading}
                            multiple={true}
                            freeSolo={false}
                            filterOptions={(x) => x}
                            options={nonCredentialedUsers}
                            includeInputInList={true}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${selectedNonCredentialedUsers.length - 2}`
                            }
                            value={selectedNonCredentialedUsers}
                            inputValue={searchMemberInput}
                            getOptionLabel={(option: any) => {
                                return `${option.name}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return option.name === value.name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedUsers([...newValue]);
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
                                setSearchMemberInput(newValue);
                                setOffset(0);
                                setNonCredentialedUsers([]);
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
                        variant="text"
                        sx={{ color: '#212121' }}
                        onClick={() => {
                            setAddMembersModal(false);
                            setOffset(0);
                            setNonCredentialedUsers([]);
                        }}
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
                        Add
                    </Button>
                </Modal.Actions>
            </Modal>

            <AddTeamModal
                open={editTeam}
                isEdit={true}
                type={type?.toLocaleLowerCase()}
                id={id}
                description={description}
                onClose={(team) => {
                    if (team) {
                        const obj = {
                            id: team.id,
                            description: team.description,
                        };

                        if (team.type != 'Custom') {
                            obj['type'] = team.type;
                        }

                        dispatch({
                            type: 'field',
                            field: 'teams',
                            value: [...teams, obj],
                        });
                    }
                    setEditTeam(false);
                }}
            />
        </React.Fragment>
    );
};
