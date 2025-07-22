import React, { useState, useEffect } from 'react';
import { useRootStore } from '@/hooks';
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
    appId: string;
    isUploadProjectApp: boolean;
    engineIdToName?: Record<string, string>;
    engineDetails: Record<string, { files: string[]; instances: (string | number)[] }>;
}

const EngineIdsModal: React.FC<EngineIdsModalProps> = ({
    open,
    successIds,
    failedIds,
    onClose,
    onEngineReplacement,
    appId,
    isUploadProjectApp,
    engineIdToName,
    engineDetails
}) => {
    const [engineReplacements, setEngineReplacements] = useState<
        Record<string, string>
    >({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [replacementsToShow, setReplacementsToShow] = useState<Record<string, string>>({});
    const { monolithStore } = useRootStore();
    const myfilePath = isUploadProjectApp ? "version/assets" : "version/assets/assets";
    const [showDiscovery, setShowDiscovery] = useState(open);
    const [replacementDetails, setReplacementDetails] = useState<Record<string, { replacement: string; files: string[]; engineName: string }>>({});

    // Fetch available engines that user has access to
    const availableEngines = usePixel<engine[]>('MyEngines();');
    console.log("availbale engines   :", availableEngines);
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
    useEffect(() => {
        setShowDiscovery(open);
    }, [open]);

    const handleEngineReplacementChange = (
        failedEngineId: string,
        replacementEngineId: string,
    ) => {
        setEngineReplacements((prev) => ({
            ...prev,
            [failedEngineId]: replacementEngineId,
        }));
    };
    const handleSaveReplacements = async () => {
        // Only include replacements that have been selected
        const validReplacements = Object.entries(engineReplacements)
            .filter(([, replacement]) => replacement !== '')
            .reduce((acc, [failed, replacement]) => {
                acc[failed] = replacement;
                return acc;
            }, {} as Record<string, string>);

        // Format map as required
        const mapStr = `[ { ${Object.entries(validReplacements)
            .map(([failed, replacement]) => `"${failed}" : "${replacement}"`)
            .join(', ')} } ]`;
        const response = await monolithStore.runQuery(
            `ReplaceInaccessibleEngines(filePath=["${myfilePath}"], space=["${appId}"], map=${mapStr});`
        );
        const successObj = response?.pixelReturn?.[0]?.output?.success ?? {};
        const successKeys = Object.keys(successObj);


        if (successKeys.length > 0) {
            const details: Record<string, { replacement: string; files: string[]; engineName: string }> = {};
            successKeys.forEach((failedId) => {
                details[failedId] = {
                    replacement: validReplacements[failedId],
                    files: successObj[failedId]?.files || [],
                    engineName: successObj[failedId]?.engineName || '',
                };
            });
            setReplacementDetails(details);
            setReplacementsToShow(validReplacements);
            setShowDiscovery(false);
            setShowConfirmation(true);
        } else {
            if (onEngineReplacement) {
                onEngineReplacement(validReplacements);
            }
            onClose();
        }
    };
    const handleConfirmationClose = () => {
        setShowConfirmation(false);
        if (onEngineReplacement) {
            onEngineReplacement(replacementsToShow);
        }
        setShowDiscovery(false);
        onClose();
    };

    const hasValidReplacements =
        failedIds.length > 0 &&
        failedIds.some(
            (id) => engineReplacements[id] && engineReplacements[id] !== '',
        );

    return (
        <>
            <Modal
                open={showDiscovery}
                maxWidth={false}
                sx={{ '& .MuiDialog-paper': { width: '95vw', maxWidth: 1000, minWidth: 320, minHeight: '70vh' } }}
            >
                <Modal.Title>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ p: 1 }}
                    >
                        <Typography
                            variant="h6"
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
                                                {engineIdToName?.[id] && (
                                                    <span style={{ color: '#1976d2', fontWeight: 500, marginLeft: 12 }}>
                                                        ({engineIdToName[id]})
                                                    </span>
                                                )}
                                            </Typography>
                                            {engineDetails?.[id]?.files?.length > 0 && (
                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                    {engineDetails[id].files.map((file) => (
                                                        <Typography
                                                            key={file}
                                                            variant="caption"
                                                            sx={{
                                                                backgroundColor: 'grey.100',
                                                                color: 'text.secondary',
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {file}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            )}
                                            {engineDetails?.[id]?.instances?.length > 0 && (
                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                    {engineDetails[id].instances.map((inst, idx) => (
                                                        <Typography
                                                            key={idx}
                                                            variant="caption"
                                                            sx={{
                                                                backgroundColor: 'grey.200',
                                                                color: 'primary.main',
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 1,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {inst}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            )}
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
                                    failedIds.map((id, index) => (
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
                                                {engineDetails?.[id]?.files?.length > 0 && (
                                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                        {engineDetails[id].files.map((file) => (
                                                            <Typography
                                                                key={file}
                                                                variant="caption"
                                                                sx={{
                                                                    backgroundColor: 'grey.100',
                                                                    color: 'text.secondary',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {file}
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                )}
                                                {engineDetails?.[id]?.instances?.length > 0 && (
                                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                        {engineDetails[id].instances.map((inst, idx) => (
                                                            <Typography
                                                                key={idx}
                                                                variant="caption"
                                                                sx={{
                                                                    backgroundColor: 'grey.200',
                                                                    color: 'primary.main',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {inst}
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                )}
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
                                                    {!engineReplacements[id] && (
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                left: 16,
                                                                top: 8,
                                                                color: '#999',
                                                                fontStyle: 'italic',
                                                                pointerEvents: 'none',
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            Select replacement engine
                                                        </span>
                                                    )}
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
            <Modal
                open={showConfirmation}
                fullWidth
                maxWidth={false}
                sx={{ '& .MuiDialog-paper': { width: '80vw', maxWidth: 1000, minWidth: 320 } }}
            >
                <Modal.Title>
                    <Typography variant="h6" align="center" sx={{ flex: 1, fontWeight: 600 }}>
                        Engine Replacement Confirmation
                    </Typography>
                </Modal.Title>
                <Modal.Content sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <span style={{ color: '#555' }}>
                            The following engine IDs have been replaced:
                        </span>
                    </Typography>
                    <Stack spacing={1.5} sx={{ pl: 1, width: '100%' }}>
                        {Object.entries(replacementDetails).map(([failed, detail], index) => (
                            <Stack
                                key={failed}
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
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.8rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {failed}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mx: 1, color: 'text.disabled' }}>
                                        &rarr;
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'success.main',
                                            fontFamily: 'monospace',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.8rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {detail.replacement}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            ml: 2,
                                            color: 'primary.main',
                                            fontWeight: 500,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        ( {detail.engineName} )
                                    </Typography>
                                    {detail.files && detail.files.length > 0 && (
                                        <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                                            {detail.files.map((file) => (
                                                <Typography
                                                    key={file}
                                                    variant="caption"
                                                    sx={{
                                                        backgroundColor: 'grey.100',
                                                        color: 'text.secondary',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {file}
                                                </Typography>
                                            ))}
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Stack direction="row" justifyContent="center" sx={{ p: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleConfirmationClose}
                            sx={{ minWidth: 120, py: 1.5 }}
                        >
                            OK
                        </Button>
                    </Stack>
                </Modal.Actions>
            </Modal>
        </>
    );
};

export default EngineIdsModal;