import React, { useMemo, useState, useEffect } from 'react';
import {
    MoreVert,
    DeleteRounded,
    ClearRounded,
    Close,
} from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import { AddTeamModal } from '@/components/teams/AddTeamModal';
import { useAPI, useDebounceValue, useRootStore, useSettings } from '@/hooks';
import { MembersAddOverlayUser } from '../settings/MembersAddOverlayUser';
import { AxiosResponse } from 'axios';
import { SETTINGS_ROLE } from '../settings/settings.types';

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
    TextField,
} from '@semoss/ui';

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

const StyledModal = styled(Modal.Content)(({ theme }) => ({
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledOuterBox = styled('div')(({ theme }) => ({
    flexShrink: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '200px',
    overflow: 'auto',
    gap: theme.spacing(1),
}));

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
}
const AUTOCOMPLETE_OFFSET = 0;
const AUTOCOMPLETE_LIMIT = 10;

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

const StyledModalTitle = styled(Modal.Title)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
}));

export const TeamTileCard = (props: TeamCardProps) => {
    const { id, description, type, tag, dispatch, teams, onClick } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [hover, setHover] = React.useState(false);
    const [deleteModal, setDeleteModal] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
        null,
    );

    const randomColor = useMemo(() => {
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);
    const [editModal, setEditModal] = useState(false);

    //modal member logic
    const [isScrollBottom, setIsScrollBottom] = useState(false);
    const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
    const [renderedMembers, setRenderedMembers] = useState([]);
    const [infiniteOn, setInfiniteOn] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addMember, setAddMember] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [search, setSearch] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<SETTINGS_ROLE>(null);
    const [restriction, setRestriction] = useState<string>('null');
    const [frequency, setFrequency] = useState<string>('');
    const [maxTokens, setMaxTokens] = useState<string>('');
    const [maxTime, setMaxTime] = useState<string>('');

    const debouncedSearch = useDebounceValue(search);

    const { adminMode } = useSettings();

    const getMembersApi: Parameters<typeof useAPI>[0] = [
        'getProjectUsersNoCredentials',
        adminMode,
        id,
        AUTOCOMPLETE_LIMIT, // limit
        offset, // offset
        debouncedSearch ? debouncedSearch : undefined,
    ];

    const getMembers = useAPI(addMember ? getMembersApi : null);

    const isLoading =
        getMembers.status === 'INITIAL' || getMembers.status === 'LOADING';

    useEffect(() => {
        if (getMembers.status === 'SUCCESS') {
            if (getMembers.data.data.length < AUTOCOMPLETE_LIMIT) {
                setInfiniteOn(false);
            }
            if (renderedMembers.length >= AUTOCOMPLETE_LIMIT && offset > 0) {
                setRenderedMembers((prev) => {
                    return [...prev, ...getMembers.data.data];
                });
                setSearchLoading(false);
            } else {
                setRenderedMembers(getMembers.data.data);
                setSearchLoading(false);
            }
        }
    }, [getMembers.status]);

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

    const open = Boolean(anchorEl);
    const popoverId = open ? 'simple-popover' : undefined;

    const addMembers = async () => {
        console.log('function call test');
        let success = false;

        try {
            let requests: any = null;
            requests = selectedMembers.map((m) => {
                return {
                    userid: m.id,
                    permission: permissionMapper[selectedRole],
                    email: m.email,
                    name: m.name,
                    type: m.type,
                    username: m.username,
                };
            });
            // }

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No permissions to change`,
                });

                return;
            }

            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.addProjectUserPermissions(
                adminMode,
                id,
                requests,
            );

            if (!response) {
                return;
            }

            if (response.data.success) {
                notification.add({
                    color: 'success',
                    message: 'Successfully added member permissions',
                });

                success = true;
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
            setAddMember(false);
        }
    };

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
                            <MenuItemTwo
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAddMember(true);
                                    handleClose(e);
                                }}
                            >
                                <Stack direction="row" gap={2}>
                                    <PersonAddIcon />
                                    <div>Add member to team</div>
                                </Stack>
                            </MenuItemTwo>
                            <MenuItemTwo
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditModal(true);
                                    handleClose(e);
                                }}
                            >
                                <Stack direction="row" gap={2}>
                                    <EditIcon />
                                    <div>Edit team</div>
                                </Stack>
                            </MenuItemTwo>
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
            <AddTeamModal
                open={editModal}
                isEdit={true}
                type={type.toLocaleLowerCase()}
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
                    setEditModal(false);
                }}
            />
            <Modal open={addMember} fullWidth>
                <StyledModalTitle>
                    <Typography sx={{ color: '#000000DE' }} variant="h6">
                        Add Members to Team
                    </Typography>
                    <IconButton onClick={() => setAddMember(false)}>
                        <Close />
                    </IconButton>
                </StyledModalTitle>
                <StyledModal>
                    <Autocomplete
                        label="Search"
                        loading={isLoading || searchLoading}
                        multiple={true}
                        freeSolo={false}
                        filterOptions={(x) => x}
                        options={renderedMembers ? renderedMembers : []}
                        includeInputInList={true}
                        limitTags={2}
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
                        getLimitTagsText={() =>
                            ` +${selectedMembers.length - 2}`
                        }
                        value={selectedMembers}
                        inputValue={search}
                        getOptionLabel={(option) => {
                            return `${option.name}`;
                        }}
                        isOptionEqualToValue={(option, value) => {
                            return option.id === value.id;
                        }}
                        onInputChange={(event, newValue) => {
                            setSearch(newValue);
                            setOffset(0);
                            setInfiniteOn(true);
                            setRenderedMembers([]);
                            setSearchLoading(true);
                        }}
                        onChange={(event, newValue) => {
                            setSelectedMembers(newValue || []);
                        }}
                        renderOption={(props, option) => {
                            const { ...optionProps } = props;
                            return (
                                <li key={option.id} {...optionProps}>
                                    <MembersAddOverlayUser
                                        name={option.name}
                                        id={option.id}
                                        email={option.email}
                                        type={option.type}
                                    />
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Search users"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: null,
                                }}
                            />
                        )}
                    />
                    <StyledOuterBox>
                        {selectedMembers.map((user) => (
                            <MembersAddOverlayUser
                                key={user.id}
                                name={user.name}
                                id={user.id}
                                email={user.email}
                                type={user.type}
                                action={
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            const filtered =
                                                selectedMembers.filter(
                                                    (val) => val.id !== user.id,
                                                );

                                            setSelectedMembers(filtered);
                                        }}
                                    >
                                        <ClearRounded fontSize="small" />
                                    </IconButton>
                                }
                            />
                        ))}
                    </StyledOuterBox>
                </StyledModal>
                <Modal.Actions
                    sx={{ marginBottom: '24px', paddingRight: '16px' }}
                >
                    <Button
                        variant="text"
                        sx={{ color: '#212121' }}
                        onClick={() => setAddMember(false)}
                    >
                        Cancel
                    </Button>
                    {/* {user === null && ( */}
                    <Button
                        variant={'contained'}
                        color="primary"
                        onClick={() => {
                            addMembers();
                        }}
                    >
                        Add
                    </Button>
                </Modal.Actions>
            </Modal>
        </React.Fragment>
    );
};
