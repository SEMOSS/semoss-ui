import { useEffect, useState } from 'react';
import {
    styled,
    Button,
    IconButton,
    Avatar,
    Modal,
    RadioGroup,
    Typography,
    Autocomplete,
    Card,
    Box,
    Icon,
    Stack,
    useNotification,
    TextField,
} from '@semoss/ui';
import {
    EditRounded,
    RemoveRedEyeRounded,
    ClearRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { ALL_TYPES } from '@/types';
import { PERMISSION_DESCRIPTION_MAP } from '@/constants';

import { useAPI, useDebounceValue, useRootStore, useSettings } from '@/hooks';
import { MembersAddOverlayUser } from './MembersAddOverlayUser';
import { SETTINGS_ROLE } from './settings.types';

const StyledModal = styled(Modal.Content)(({ theme }) => ({
    maxWidth: '50rem',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledSelection = styled('div')(({ theme }) => ({
    backgroundColor: 'rgba(0,0,0,.03)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
}));

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

const StyledCardHeader = styled(Card.Header)({
    color: '#000',
    width: '100%',
});

const StyledOuterBox = styled('div')(({ theme }) => ({
    flexShrink: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '200px',
    overflow: 'auto',
    gap: theme.spacing(1),
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

const AUTOCOMPLETE_OFFSET = 0;
const AUTOCOMPLETE_LIMIT = 10;

interface MembersAddOverlayProps {
    /**
     * Type of engine
     */
    type: ALL_TYPES;

    /**
     * ID of the app or engine being edited
     */
    id: string;

    /**
     * Track if the model is open or close
     */
    open: boolean;

    /**
     * Called on close
     *
     * @returns - method that is called onClose
     */
    onClose: (success: boolean) => void;
}

export const MembersAddOverlay = (props: MembersAddOverlayProps) => {
    const { type, id, open = false, onClose = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    /** Add Member State */
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [selectedRole, setSelectedRole] =
        useState<SETTINGS_ROLE>('Read-Only');
    const [search, setSearch] = useState<string>('');

    //modal member logic
    const [isScrollBottom, setIsScrollBottom] = useState(false);
    const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
    const [renderedMembers, setRenderedMembers] = useState([]);
    const [infiniteOn, setInfiniteOn] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    // debounce the input
    const debouncedSearch = useDebounceValue(search);

    useEffect(() => {
        // reset on open or close
        setSelectedMembers([]);
        setSelectedRole('Read-Only');
        setSearch('');
    }, [open]);

    // TODO: Implement Lazy Loading
    // get the api
    const getMembersApi: Parameters<typeof useAPI>[0] =
        type === 'DATABASE' ||
        type === 'STORAGE' ||
        type === 'MODEL' ||
        type === 'VECTOR' ||
        type === 'FUNCTION'
            ? [
                  'getEngineUsersNoCredentials',
                  adminMode,
                  id,
                  AUTOCOMPLETE_LIMIT, // limit
                  offset, // offset
                  debouncedSearch ? debouncedSearch : undefined,
              ]
            : type === 'APP'
            ? [
                  'getProjectUsersNoCredentials',
                  adminMode,
                  id,
                  AUTOCOMPLETE_LIMIT, // limit
                  offset, // offset
                  debouncedSearch ? debouncedSearch : undefined,
              ]
            : null;

    const getMembers = useAPI(open ? getMembersApi : null);

    const isLoading =
        getMembers.status === 'INITIAL' || getMembers.status === 'LOADING';

    useEffect(() => {
        if (getMembers.status === 'SUCCESS') {
            if (getMembers.data.data.length < 10) {
                setInfiniteOn(false);
            }
            if (renderedMembers.length >= 10 && offset > 0) {
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

    const getAdditionalMembers = () => {
        setOffset(offset + 10);
    };

    /**
     * @name addMembers
     *
     * Add members to the app or engine
     */
    const addMembers = async () => {
        let success = false;

        try {
            // construct requests for post data
            const requests = selectedMembers.map((m) => {
                return {
                    userid: m.id,
                    permission: permissionMapper[selectedRole],
                    email: m.email,
                    name: m.name,
                    type: m.type,
                    username: m.username,
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
                response = await monolithStore.addEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'APP') {
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
            // close the overlay
            onClose(success);
        }
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

    useEffect(() => {
        if (isScrollBottom) {
            if (infiniteOn) {
                getAdditionalMembers();
            }
        }
    }, [isScrollBottom]);

    return (
        <Modal open={open} maxWidth="lg">
            <Modal.Title>Add Members</Modal.Title>
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
                    getLimitTagsText={() => ` +${selectedMembers.length - 2}`}
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
                                        // remove any selected users from the array
                                        const filtered = selectedMembers.filter(
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

                <Typography variant="subtitle1">Permissions</Typography>
                <StyledSelection>
                    <RadioGroup
                        label={''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                                setSelectedRole(val as SETTINGS_ROLE);
                            }
                        }}
                    >
                        <Stack spacing={1}>
                            <StyledCard>
                                <StyledCardHeader
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
                                            sx={{
                                                marginLeft: '30px',
                                            }}
                                        >
                                            {PERMISSION_DESCRIPTION_MAP[type]
                                                .author ||
                                                `Error: update key in test-editor.constants to "${name}"`}
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
                                            sx={{
                                                marginLeft: '30px',
                                            }}
                                        >
                                            {PERMISSION_DESCRIPTION_MAP[type]
                                                .editor ||
                                                `Error: update key in test-editor.constants to "${name}"`}
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
                                            sx={{
                                                marginLeft: '30px',
                                            }}
                                        >
                                            {PERMISSION_DESCRIPTION_MAP[type]
                                                .readonly ||
                                                `Error: update key in test-editor.constants to "${name}"`}
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
                </StyledSelection>
            </StyledModal>
            <Modal.Actions>
                <Button variant="outlined" onClick={() => onClose(false)}>
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    color="primary"
                    disabled={!selectedRole || selectedMembers.length < 1}
                    onClick={() => {
                        addMembers();
                    }}
                >
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
