import { useEffect, useState, lazy } from 'react';
import { usePixel, useRootStore } from '@/hooks';
import {
    styled,
    Button,
    Stack,
    useNotification,
    Typography,
    TextArea,
    Paper,
    Box,
} from '@semoss/ui';
import {
    CachedRounded,
    CheckRounded,
    PlayArrowRounded,
} from '@mui/icons-material';

const Editor = lazy(() => import('@monaco-editor/react'));

const StyledPaper = styled(Paper)({});

export const EngineFileEditor = ({
    engineId,
    filePath,
}: {
    engineId: string;
    filePath: string;
}) => {
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const [fileContent, setFileContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [resultValue, setResultValue] = useState('');
    const [readOnly, setReadOnly] = useState(true);

    const fullPath = filePath.replace(/\\/g, '/');
    const fileName = fullPath.split('/').pop();

    const { data, status } = usePixel<
        {
            lastModified: string;
            name: string;
            path: string;
            type: 'directory' | 'file';
        }[]
    >(`GetEngineFiles(engine=['${engineId}'], filePath=["/${fileName}"])`);

    useEffect(() => {
        if (status === 'SUCCESS' && data) {
            try {
                const engineOutput = Object.values(data)?.[0] as {
                    files?: { fileName: string; content: string }[];
                };
                const files = engineOutput?.files;

                if (Array.isArray(files)) {
                    const file = files.find((f) => f.fileName === fileName);
                    setFileContent(file?.content || '');
                } else {
                    console.warn('No files found');
                }
            } catch (error) {
                console.error('Error parsing file content:', error);
            }
        }
    }, [data, status, fileName]);

    if (status === 'LOADING' || status === 'INITIAL') {
        return <div>Loading file content...</div>;
    }

    if (status === 'ERROR') {
        return <div>Error loading file</div>;
    }

    const saveEngine = async () => {
        // turn on loading
        setIsSaving(true);

        try {
            const { errors } = await monolithStore.runQuery<[true]>(
                `SaveEngineAssets(engine=['${engineId}'], filePath=["/${fileName}"], content=["${fileContent}"])`,
            );

            if (errors.length > 0) {
                throw new Error(errors.join(''));
            }

            notification.add({
                color: 'success',
                message: 'Successfully saved the changes!',
            });
            setReadOnly(true);
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            setIsSaving(false);
        }
    };

    const runEngine = async () => {
        // turn on loading
        setIsSaving(true);

        try {
            const { errors, pixelReturn } = await monolithStore.runQuery<
                [true]
            >(
                `ExecuteTempPythonFunctionEngine(engine=['${engineId}'], map=[{"route":"", "file_path":"", "engine_id":""}])`,
            );

            setResultValue(pixelReturn[0].output as any);

            if (errors.length > 0) {
                throw new Error(errors.join(''));
            }

            notification.add({
                color: 'success',
                message: 'Successfully saved the changes!',
            });
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            setIsSaving(false);
        }
    };

    return (
        <div style={{ position: 'relative', paddingTop: '15px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px',
                    position: 'absolute',
                    right: 0,
                    top: '-30px',
                    zIndex: 1,
                }}
            >
                <Stack direction="row" spacing={1}>
                    {readOnly ? (
                        <Button
                            onClick={() => setReadOnly(false)}
                            sx={{
                                borderColor: '#c4c4c4',
                                color: '#212121',
                                fontSize: '13px',
                                borderRadius: '12px',
                            }}
                            variant="outlined"
                            startIcon={<CheckRounded />}
                            disabled={isSaving}
                        >
                            Edit
                        </Button>
                    ) : (
                        <Button
                            onClick={() => saveEngine()}
                            sx={{
                                borderColor: '#c4c4c4',
                                color: '#212121',
                                fontSize: '13px',
                                borderRadius: '12px',
                            }}
                            variant="outlined"
                            startIcon={<CheckRounded />}
                            disabled={isSaving}
                        >
                            Save
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            runEngine();
                        }}
                        sx={{ borderRadius: '12px' }}
                        variant="contained"
                        startIcon={<PlayArrowRounded />}
                    >
                        Run
                    </Button>
                </Stack>
            </div>
            <StyledPaper
                elevation={1}
                sx={{
                    position: 'relative',
                    border: '1px solid #90caf9',
                    borderRadius: '8px',
                    paddingTop: readOnly ? '20px' : '50px',
                    '& .monaco-editor': {
                        outline: 'none !important',
                        border: 'none !important',
                        boxShadow: 'none !important',
                        borderRadius: '8px',
                    },
                    '& .monaco-editor .overflow-guard': {
                        borderRadius: '8px',
                    },
                }}
            >
                {!readOnly && (
                    <Box
                        sx={{
                            width: '100%',
                            position: 'absolute',
                            top: '0',
                            left: '50%',
                            right: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#e3f2fd',
                            padding: '8px 12px',
                            borderRadius: '8px 8px 0 0',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1976d2',
                            zIndex: 1,
                        }}
                    >
                        Edit Mode
                    </Box>
                )}
                <Editor
                    height="500px"
                    defaultLanguage="python"
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    options={{
                        readOnly: readOnly,
                        fontSize: 14,
                        fontFamily: 'monospace',
                        minimap: { enabled: false },
                    }}
                />
            </StyledPaper>
            <div
                style={{
                    marginTop: '15px',
                    border: '1px solid #c4c4c4',
                    borderRadius: '16px',
                    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
                    padding: '16px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        background: 'rgba(0, 0, 0, 0.04)',
                        padding: '6px 16px',
                        borderRadius: '16px 16px 0 0',
                    }}
                >
                    <Typography
                        variant="button"
                        sx={{ color: 'rgba(0, 0, 0, 0.38)' }}
                    >
                        Results
                    </Typography>
                    <Button
                        onClick={() => setResultValue('')}
                        sx={{
                            border: '1px solid #c4c4c4',
                            color: '#212121',
                            fontSize: '13px',
                            borderRadius: '12px',
                        }}
                        startIcon={<CachedRounded />}
                    >
                        Clear
                    </Button>
                </div>
                <TextArea
                    sx={{ borderRadius: '8px', marginTop: '10px' }}
                    fullWidth
                    placeholder="Enter Input Here"
                    minRows={2}
                    maxRows={4}
                    value={resultValue}
                />
                <Typography variant="caption" color="secondary">
                    If your code takes input, add it in the above box before
                    running.
                </Typography>
            </div>
        </div>
    );
};
