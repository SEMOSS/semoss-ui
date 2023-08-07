import React, { useState } from 'react';
import { useRootStore } from '@/hooks';
import { useNotification } from '@semoss/components';
import {
    Avatar,
    Box,
    Button,
    Card,
    Icon,
    Modal,
    RadioGroup,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';
import { EditRounded, RemoveRedEyeRounded } from '@mui/icons-material';

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

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

interface RequestAccessProps {
    /** Id of the current engine */
    id: string;

    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;
}

type Role = 'Author' | 'Editor' | 'Read-Only' | '' | null;

export const RequestAccess = (props: RequestAccessProps) => {
    const { id, open, onClose } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [requestAccessRole, setRequestAccessRole] = useState<Role>('');

    const requestAccess = () => {
        const pixel = `META | RequestEngine(engine=['${id}'], permission=['${permissionMapper[requestAccessRole]}'])`;

        monolithStore.runQuery(pixel).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    content: output,
                });
            }

            // close it and succesfully message
            onClose(true);
        });
    };

    return (
        <Modal
            open={open}
            maxWidth={'md'}
            onClose={() => {
                onClose(false);
            }}
        >
            <Modal.Title>Request Access</Modal.Title>
            <Modal.Content>
                <RadioGroup
                    label={''}
                    onChange={(e) => {
                        setRequestAccessRole(e.target.value as Role);
                    }}
                >
                    <Stack spacing={1}>
                        <StyledCard>
                            <Card.Header
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
                                    <Box sx={{ marginLeft: '30px' }}>
                                        Ability to provision other users, edit
                                        database details and hide or delete the
                                        database.
                                    </Box>
                                }
                                action={
                                    <RadioGroup.Item value="Author" label="" />
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
                                    <Box sx={{ marginLeft: '30px' }}>
                                        Has the ability to use the database to
                                        generate insights and can query against
                                        the database.
                                    </Box>
                                }
                                action={
                                    <RadioGroup.Item value="Editor" label="" />
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
                                    <Box sx={{ marginLeft: '30px' }}>
                                        Can view insights built using the
                                        database.
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
            </Modal.Content>
            <Modal.Actions>
                <Button
                    variant={'outlined'}
                    onClick={() => {
                        onClose(false);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    disabled={!requestAccessRole}
                    onClick={() => {
                        requestAccess();
                    }}
                >
                    Request
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
