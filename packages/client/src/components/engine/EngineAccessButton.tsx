import { useEffect, useState } from 'react';
import {
    styled,
    useNotification,
    Avatar,
    Box,
    Button,
    Card,
    Icon,
    Modal,
    RadioGroup,
    Stack,
} from '@semoss/ui';
import { EditRounded, RemoveRedEyeRounded, Add } from '@mui/icons-material';

import { Role } from '@/types';
import { useRootStore, useEngine } from '@/hooks';

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

export const EngineAccessButton = () => {
    // get the database information
    const { id, role } = useEngine();

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // track if open
    const [open, setOpen] = useState(false);
    const [requestedRole, setRequestedRole] = useState<Role>(role);

    // close when the id changes
    useEffect(() => {
        setOpen(false);
    }, [id]);

    // update the requested whenever the role changes
    useEffect(() => {
        setRequestedRole(role);
    }, [role]);

    /**
     * Request the new access
     */
    const requestAccess = async () => {
        try {
            const response = await monolithStore.runQuery(
                `META | RequestEngine(engine=['${id}'], permission=['${requestedRole}'])`,
            );

            const { operationType, output } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }

            notification.add({
                color: 'success',
                message: output,
            });

            // close is
            setOpen(false);
        } catch (e) {
            // noop
        }
    };

    // cannot request access if the owner
    if (role === 'OWNER') {
        return null;
    }

    return (
        <>
            <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={() => setOpen(true)}
            >
                {role === 'DISCOVERABLE' ? (
                    <>Request Access</>
                ) : (
                    <>Change Access</>
                )}
            </Button>
            <Modal
                open={open}
                maxWidth={'md'}
                onClose={() => {
                    // close is
                    setOpen(false);
                }}
            >
                <Modal.Title>
                    {role === 'DISCOVERABLE'
                        ? 'Request Access'
                        : 'Change Access'}
                </Modal.Title>
                <Modal.Content>
                    <RadioGroup
                        label={''}
                        onChange={(e) => {
                            setRequestedRole(e.target.value as Role);
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
                                            Ability to provision other users,
                                            edit database details and hide or
                                            delete the database.
                                        </Box>
                                    }
                                    action={
                                        <RadioGroup.Item
                                            value="OWNER"
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
                                        <Box sx={{ marginLeft: '30px' }}>
                                            Has the ability to use the database
                                            to generate insights and can query
                                            against the database.
                                        </Box>
                                    }
                                    action={
                                        <RadioGroup.Item
                                            value="EDIT"
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
                                        <Box sx={{ marginLeft: '30px' }}>
                                            Can view insights built using the
                                            database.
                                        </Box>
                                    }
                                    action={
                                        <RadioGroup.Item
                                            value="READ_ONLY"
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
                            setOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        disabled={!requestedRole}
                        onClick={() => {
                            requestAccess();
                        }}
                    >
                        Request
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};
