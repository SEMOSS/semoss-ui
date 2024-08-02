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

import { useAPI, useRootStore, useSettings } from '@/hooks';
import { AddMembersOverlayUser } from './AddMembersOverlayUser';
import { SETTINGS_ROLE } from '../settings.types';

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

const StyledModalContentText = styled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

const StyledCardHeader = styled(Card.Header)({
    color: '#000',
    width: '100%',
});

const StyledOuterBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'userLength',
})<{
    userLength: number;
}>(({ userLength }) => ({
    maxHeight: userLength > 2 ? '300px' : 'auto',
    overflow: 'auto',
    transition: 'max-height 0.3s ease',
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

interface AddMembersOverlayProps {
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

export const AddMembersOverlay = (props: AddMembersOverlayProps) => {
    const { type, id, open = false, onClose = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    /** Add Member State */
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectedRole, setSelectedRole] =
        useState<SETTINGS_ROLE>('Read-Only');

    useEffect(() => {
        // reset on open or close
        setSelectedMembers([]);
        setSelectedRole('Read-Only');
    }, [open]);

    // get the api
    const getMembersApi: Parameters<typeof useAPI>[0] =
        type === 'DATABASE' ||
        type === 'STORAGE' ||
        type === 'MODEL' ||
        type === 'VECTOR' ||
        type === 'FUNCTION'
            ? ['getEngineUsersNoCredentials', adminMode, id]
            : type === 'APP'
            ? ['getProjectUsersNoCredentials', adminMode, id]
            : null;

    const getMembers = useAPI(open ? getMembersApi : null);

    const isLoading =
        getMembers.status === 'INITIAL' || getMembers.status === 'LOADING';
    const renderedMembers =
        getMembers.status === 'SUCCESS' ? getMembers.data.data : [];

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

    return (
        <Modal open={open} maxWidth="lg">
            <Modal.Title>Add Members</Modal.Title>
            <Modal.Content sx={{ width: '50rem' }}>
                <StyledModalContentText>
                    <Autocomplete
                        label="Search"
                        disabled={isLoading}
                        multiple={true}
                        options={renderedMembers}
                        limitTags={2}
                        getLimitTagsText={() =>
                            ` +${selectedMembers.length - 2}`
                        }
                        value={[...selectedMembers]}
                        getOptionLabel={(option: any) => {
                            return `${option.name}`;
                        }}
                        isOptionEqualToValue={(option, value) => {
                            return option.name === value.name;
                        }}
                        onChange={(event, newValue: any) => {
                            setSelectedMembers([...newValue]);
                        }}
                        renderOption={(props, option) => {
                            const { ...optionProps } = props;
                            return (
                                <li {...optionProps}>
                                    <AddMembersOverlayUser
                                        name={option.name}
                                        username={option.username}
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
                                    value: '',
                                    startAdornment: null,
                                }}
                            />
                        )}
                    />
                    <StyledOuterBox userLength={selectedMembers.length}>
                        {selectedMembers.map((user) => (
                            <AddMembersOverlayUser
                                key={user.id}
                                name={user.name}
                                username={user.username}
                                email={user.email}
                                type={user.type}
                                action={
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            // remove any selected users from the array
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
                                                {PERMISSION_DESCRIPTION_MAP[
                                                    type
                                                ].author ||
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
                                                {PERMISSION_DESCRIPTION_MAP[
                                                    type
                                                ].editor ||
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
                                                {PERMISSION_DESCRIPTION_MAP[
                                                    type
                                                ].readonly ||
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
                    </Box>
                </StyledModalContentText>
            </Modal.Content>
            <Modal.Actions>
                <Button variant="outlined" onClick={() => onClose(false)}>
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
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
