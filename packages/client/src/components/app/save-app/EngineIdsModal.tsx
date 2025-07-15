import React from 'react';
import { Modal, Paper, Typography, Stack, Button, IconButton } from '@semoss/ui';
import Close from '@mui/icons-material/Close';

interface EngineIdsModalProps {
    open: boolean;
    successIds: string[];
    failedIds: string[];
    onClose: () => void;
}

const EngineIdsModal: React.FC<EngineIdsModalProps> = ({
    open,
    successIds,
    failedIds,
    onClose,
}) => (
    <Modal open={open} fullWidth>
        <Modal.Title>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" align="center" sx={{ flex: 1 }}>
                    Engine IDs Found
                </Typography>
                <IconButton aria-label="close" onClick={onClose}>
                    <Close />
                </IconButton>
            </Stack>
        </Modal.Title>
        <Modal.Content>
            <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Typography variant="subtitle2" align="center">
                    The following engine IDs were detected:
                </Typography>
                <Typography variant="subtitle2" color="success.main" sx={{ mt: 2 }}>
                    Success
                </Typography>
                <Stack spacing={1} sx={{ pl: 2, width: '100%' }}>
                    {successIds.length > 0 ? (
                        successIds.map((id) => (
                            <Typography key={id} variant="body2" sx={{ wordBreak: 'break-all' }} align='center'>
                                {id}
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" align='center'>
                            No successful engine IDs.
                        </Typography>
                    )}
                </Stack>
                <Typography variant="subtitle2" color="error.main" sx={{ mt: 2 }}>
                    Failed
                </Typography>
                <Stack spacing={1} sx={{ pl: 2, width: '100%' }}>
                    {failedIds.length > 0 ? (
                        failedIds.map((id) => (
                            <Typography key={id} variant="body2" sx={{ wordBreak: 'break-all' }} align='center'>
                                {id}
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" align='center'>
                            No failed engine IDs.
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Modal.Content>
        <Modal.Actions>
            <Stack direction="row" justifyContent="center" width="100%" padding={2}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{ minWidth: 100 }}
                >
                    OK
                </Button>
            </Stack>
        </Modal.Actions>
    </Modal>
);

export default EngineIdsModal;