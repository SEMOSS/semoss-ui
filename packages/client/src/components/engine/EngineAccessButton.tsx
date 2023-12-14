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
    TextArea,
} from '@semoss/ui';
import { EditRounded, RemoveRedEyeRounded, Add } from '@mui/icons-material';
import { PERMISSION_DESCRIPTION_MAP } from '@/components/settings/member-permissions.constants';

import { Role } from '@/types';
import { useRootStore, useEngine } from '@/hooks';

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

interface EngineAccessButtonProps {
    /**
     * Model, Vector, Storage, Database, Function
     */
    name: string;
}

export const EngineAccessButton = (props: EngineAccessButtonProps) => {
    const { name } = props;
    const { id, role } = useEngine();

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // track if open
    const [open, setOpen] = useState(false);
    const [requestedRole, setRequestedRole] = useState<Role>(role);

    const [comment, setComment] = useState<string>('');

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
                `META | RequestEngine(engine=['${id}'], permission=['${requestedRole}']${
                    comment && `, comment=['${comment}']`
                })`,
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
                                            {
                                                PERMISSION_DESCRIPTION_MAP[
                                                    name.toLowerCase()
                                                ]?.author
                                            }
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
                                            {
                                                PERMISSION_DESCRIPTION_MAP[
                                                    name.toLowerCase()
                                                ]?.editor
                                            }
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
                                            {
                                                PERMISSION_DESCRIPTION_MAP[
                                                    name.toLowerCase()
                                                ]?.readonly
                                            }
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

                            {/* tom---> comment textarea if we want this here, can be removed */}
                            <Card.Header title={<Box>Comment:</Box>} />
                            <TextArea
                                required={false}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                            ></TextArea>
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
