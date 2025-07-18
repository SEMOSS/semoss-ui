import React, { useState, useEffect } from 'react';
import {
    Modal,
    Typography,
    Stack,
    Button,
    IconButton,
    Select,
    FormControl,
    MenuItem,
} from '@semoss/ui';
import Close from '@mui/icons-material/Close';
import { usePixel } from '@/hooks';
import { engine } from '../app-details.utility';

interface EngineIdsModalProps {
    open: boolean;
    successIds: string[];
    failedIds: string[];
    onClose: () => void;
    onEngineReplacement?: (replacements: Record<string, string>) => void;
}

const EngineIdsModal: React.FC<EngineIdsModalProps> = ({
    open,
    successIds,
    failedIds,
    onClose,
    onEngineReplacement,
}) => {
    const [engineReplacements, setEngineReplacements] = useState<
        Record<string, string>
    >({});

    // Fetch available engines that user has access to
    const availableEngines = usePixel<engine[]>('MyEngines();');

    useEffect(() => {
        // Initialize replacement state when modal opens
        if (open && failedIds.length > 0) {
            const initialReplacements: Record<string, string> = {};
            failedIds.forEach((id) => {
                initialReplacements[id] = '';
            });
            setEngineReplacements(initialReplacements);
        }
    }, [open, failedIds]);

    const handleEngineReplacementChange = (
        failedEngineId: string,
        replacementEngineId: string,
    ) => {
        setEngineReplacements((prev) => ({
            ...prev,
            [failedEngineId]: replacementEngineId,
        }));
    };

    const handleSaveReplacements = () => {
        if (onEngineReplacement) {
            // Only include replacements that have been selected
            const validReplacements = Object.entries(engineReplacements)
                .filter(([, replacement]) => replacement !== '')
                .reduce((acc, [failed, replacement]) => {
                    acc[failed] = replacement;
                    return acc;
                }, {} as Record<string, string>);

            onEngineReplacement(validReplacements);
        }
        onClose();
    };

    const hasValidReplacements =
        failedIds.length > 0 &&
        failedIds.some(
            (id) => engineReplacements[id] && engineReplacements[id] !== '',
        );

    return (
        <Modal
            open={open}
            fullWidth
            maxWidth="xl"
            sx={{ '& .MuiDialog-paper': { minHeight: '70vh' } }}
        >
            <Modal.Title>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ p: 1 }}
                >
                    <Typography
                        variant="h4"
                        align="center"
                        sx={{
                            flex: 1,
                            fontWeight: 600,
                        }}
                    >
                        Engine IDs Discovery
                    </Typography>
                    <IconButton aria-label="close" onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content sx={{ p: 3 }}>
                <Stack spacing={3} sx={{ width: '100%' }}>
                    <Typography
                        variant="h6"
                        align="center"
                        sx={{
                            color: 'text.secondary',
                            mt: -1,
                        }}
                    >
                        The following engine IDs were detected in your
                        application:
                    </Typography>

                    {/* Success Section */}
                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'success.main',
                                    fontWeight: 600,
                                }}
                            >
                                Accessible Engines
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                ({successIds.length})
                            </Typography>
                        </Stack>
                        <Stack spacing={1} sx={{ pl: 1, width: '100%' }}>
                            {successIds.length > 0 ? (
                                successIds.map((id, index) => (
                                    <Stack
                                        key={id}
                                        direction="row"
                                        alignItems="center"
                                        spacing={2}
                                        sx={{
                                            backgroundColor: 'background.paper',
                                            p: 1.5,
                                            borderRadius: 1,
                                            border: 1,
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                backgroundColor: 'grey.100',
                                                color: 'text.secondary',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1,
                                                minWidth: 24,
                                                textAlign: 'center',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {index + 1}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                wordBreak: 'break-all',
                                                fontFamily: 'monospace',
                                                color: 'text.primary',
                                            }}
                                        >
                                            {id}
                                        </Typography>
                                    </Stack>
                                ))
                            ) : (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        textAlign: 'center',
                                        py: 2,
                                    }}
                                >
                                    No accessible engine IDs found.
                                </Typography>
                            )}
                        </Stack>
                    </Stack>

                    {/* Failed Section with Engine Selection */}
                    <Stack spacing={1.5} sx={{ width: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'error.main',
                                    fontWeight: 600,
                                }}
                            >
                                Inaccessible Engines
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                ({failedIds.length})
                            </Typography>
                        </Stack>
                        <Stack spacing={1.5} sx={{ pl: 1, width: '100%' }}>
                            {failedIds.length > 0 ? (
                                failedIds.map((id) => (
                                    <Stack
                                        key={id}
                                        direction="row"
                                        alignItems="center"
                                        spacing={3}
                                        sx={{
                                            width: '100%',
                                            backgroundColor: 'background.paper',
                                            p: 2,
                                            borderRadius: 1,
                                            border: 1,
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1.5}
                                            sx={{
                                                flex: '1 1 auto',
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: 'text.secondary',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Failed Engine:
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    wordBreak: 'break-all',
                                                    fontFamily: 'monospace',
                                                    color: 'text.primary',
                                                    backgroundColor: 'grey.100',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.8rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {id}
                                            </Typography>
                                        </Stack>
                                        <Stack sx={{ flex: '0 0 400px' }}>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={
                                                        engineReplacements[
                                                            id
                                                        ] || ''
                                                    }
                                                    onChange={(e) =>
                                                        handleEngineReplacementChange(
                                                            id,
                                                            e.target
                                                                .value as string,
                                                        )
                                                    }
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            py: 1,
                                                            fontSize:
                                                                '0.875rem',
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="">
                                                        <em
                                                            style={{
                                                                color: '#999',
                                                                fontStyle:
                                                                    'italic',
                                                            }}
                                                        >
                                                            Select replacement
                                                            engine
                                                        </em>
                                                    </MenuItem>
                                                    {availableEngines.data?.map(
                                                        (engine) => (
                                                            <MenuItem
                                                                key={
                                                                    engine.database_id ||
                                                                    engine.app_id
                                                                }
                                                                value={
                                                                    engine.database_id ||
                                                                    engine.app_id
                                                                }
                                                                sx={{
                                                                    fontSize:
                                                                        '0.875rem',
                                                                }}
                                                            >
                                                                {engine.database_name ||
                                                                    engine.app_name}{' '}
                                                                <span
                                                                    style={{
                                                                        color: '#666',
                                                                        fontSize:
                                                                            '0.8rem',
                                                                    }}
                                                                >
                                                                    (
                                                                    {engine.database_id ||
                                                                        engine.app_id}
                                                                    )
                                                                </span>
                                                            </MenuItem>
                                                        ),
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Stack>
                                ))
                            ) : (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        textAlign: 'center',
                                        py: 2,
                                    }}
                                >
                                    No inaccessible engine IDs found.
                                </Typography>
                            )}
                        </Stack>
                    </Stack>

                    {/* Loading state for engines */}
                    {availableEngines.status === 'LOADING' && (
                        <Stack
                            spacing={1}
                            alignItems="center"
                            sx={{
                                p: 2,
                                backgroundColor: 'background.paper',
                                borderRadius: 2,
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                }}
                            >
                                Loading available engines...
                            </Typography>
                        </Stack>
                    )}

                    {/* Error state for engines */}
                    {availableEngines.status === 'ERROR' && (
                        <Stack
                            spacing={1}
                            sx={{
                                p: 2,
                                backgroundColor: 'warning.light',
                                borderRadius: 2,
                                border: 1,
                                borderColor: 'warning.main',
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'warning.dark',
                                    fontWeight: 500,
                                }}
                            >
                                Error loading available engines
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary' }}
                            >
                                You may not have access to any engines or there
                                was a connection issue.
                            </Typography>
                        </Stack>
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={2}
                    sx={{
                        width: '100%',
                        p: 2,
                    }}
                >
                    {failedIds.length > 0 && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveReplacements}
                            disabled={!hasValidReplacements}
                            sx={{
                                minWidth: 150,
                                py: 1.5,
                            }}
                        >
                            Save Replacements
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            minWidth: 100,
                            py: 1.5,
                        }}
                    >
                        {failedIds.length > 0 ? 'Cancel' : 'OK'}
                    </Button>
                </Stack>
            </Modal.Actions>
        </Modal>
    );
};

export default EngineIdsModal;
