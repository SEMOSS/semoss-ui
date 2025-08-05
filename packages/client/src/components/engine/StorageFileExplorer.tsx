import React, { useState } from 'react';
import {
    Button,
    styled,
    Typography,
    IconButton,
    Modal,
    FileDropzone,
    CircularProgress,
    LinearProgress,
    useNotification,
} from '@semoss/ui';
import { CloudUploadOutlined, Refresh } from '@mui/icons-material';

import { StorageExplorer } from './StorageExplorer';
import { Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1),
}));

const StyledFileExplorerContainer = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    minHeight: '400px',
    maxHeight: '600px',
    overflow: 'auto',
}));

interface StorageFileExplorerProps {
    id: string;
}

type FileUploadForm = {
    PROJECT_UPLOAD: File[];
};

interface FileExplorerProps {
    fileName: string;
    fileSize: number;
    lastModified: string;
}
export const StorageFileExplorer = (props: StorageFileExplorerProps) => {
    const { id } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [openPopUp, setOpenPopUp] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);


    const refreshFiles = () => {
        setRefreshCounter((prev) => prev + 1);
    };

    const handleToggleExpand = (path: string) => {
        setExpandedPaths((prev) => {
            if (prev.includes(path)) {
                return prev.filter((p) => p !== path);
            } else {
                return [...prev, path];
            }
        });
    };

    const handleFileSelect = (path: string) => {
        setSelectedFile(path);
        console.log('Selected file:', path);
    };

    const { control, watch, setValue, handleSubmit } = useForm<{
        FILES: FileExplorerProps[];
        PROJECT_UPLOAD: File[];
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            FILES: [],
            SEARCH_FILTER: '',
            PROJECT_UPLOAD: [],
        },
    });

    const handleUpload = handleSubmit(async (data: FileUploadForm) => {
        setIsLoading(true);
        let fileLocations = '';
        console.log('data: ', data);

        try {
            const upload = await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                configStore.store.insightID,
            );

            console.log(configStore.store.insightID);

            upload.map(async (file, index) => {
                const fileLocation = file.fileLocation.replace(/\\/g, '/');
                if (index + 1 === upload.length) {
                    fileLocations = fileLocations += `"${fileLocation}"`;
                } else {
                    fileLocations = fileLocations += `"${fileLocation}", `;
                }
            });

            console.log('location:', fileLocations);

            const response = await monolithStore.runQuery(`
            Storage(storage = "${id}") | PushToStorage(storagePath='/', filePath=[${fileLocations}]);
            `);

            const { output, operationType } = response.pixelReturn[0];
            console.log(output);

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully added document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            refreshFiles();
            setIsLoading(false);
            setValue('PROJECT_UPLOAD', []);
            setOpenPopUp(false);
        }
    });

    const sanitizeFilename = (filename: string): string => {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')             .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
    };


    const extractFilename = (filePath: string): string => {
        const filename = filePath.split('/').pop() || 'downloaded_file';
        
        if (!filename || filename.trim() === '') {
            return 'downloaded_file';
        }

        const sanitized = sanitizeFilename(filename);
        
        if (!sanitized) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            return `downloaded_file_${timestamp}`;
        }

        return sanitized;
    };


    const handleDownload = async (path: string) => {
        try {
            const filename = extractFilename(path);
            
            if (path.endsWith('/')) {
                notification.add({
                    color: 'error',
                    message: 'Cannot download a directory. Please select a file.',
                });
                return;
            }

            const downloadQuery = `Storage("${id}") | PullFromStorage(storagePath="${path}", filePath="${filename}") | DownloadAsset(filePath=["${filename}"], space=["insight"]);`;
            
            console.log('Download query:', downloadQuery);
            const response = await monolithStore.runQuery(downloadQuery);
            console.log('Download response:', response);

            const fileKey = response.pixelReturn[0]?.output;

            if (!fileKey) {
                throw new Error('Failed to get file key for download. The file may not exist or there was a server error.');
            }

            await monolithStore.download(configStore.store.insightID, fileKey);

            notification.add({
                color: 'success',
                message: `Successfully downloaded: ${filename}`,
            });

            console.log('Download initiated for path:', path);
        } catch (e) {
            console.error('Download error:', e);
            
            let errorMessage = 'Download failed: ';
            if (e instanceof Error) {
                if (e.message.includes('directory')) {
                    errorMessage = 'Cannot download directories. Please select a file.';
                } else if (e.message.includes('file key')) {
                    errorMessage = 'File not found or server error occurred.';
                } else if (e.message.includes('network') || e.message.includes('fetch')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else {
                    errorMessage += e.message;
                }
            } else {
                errorMessage += 'An unexpected error occurred.';
            }
            
            notification.add({
                color: 'error',
                message: errorMessage,
            });
        }
    };


    const handleDelete = (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => {
        console.log('File deleted:', path);

        setExpandedPaths((prev) => prev.filter((p) => !p.startsWith(path)));

        if (selectedFile === path) {
            setSelectedFile('');
        }

        refreshFiles();
    };

    const handleDeleteMultiple = (paths: string[]) => {
        console.log('Multiple files deleted:', paths);
        paths.forEach((path) => {
            setExpandedPaths((prev) => prev.filter((p) => !p.startsWith(path)));
            if (selectedFile === path) {
                setSelectedFile('');
            }
        });
        refreshFiles();
    };

    const handleDownloadMultiple = (paths: string[]) => {
        console.log('Multiple files downloaded:', paths);
        paths.forEach((path) => {
            handleDownload(path);
        });
    };


    return (
        <StyledContainer>
            <StyledHeader>
                <Typography variant="h6">Storage File Explorer</Typography>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <IconButton
                        size="small"
                        color="default"
                        title="Refresh files"
                        onClick={refreshFiles}
                    >
                        <Refresh fontSize="inherit" />
                    </IconButton>
                    <Button
                        variant="outlined"
                        startIcon={<CloudUploadOutlined />}
                        onClick={() => setOpenPopUp(true)}
                        size="small"
                    >
                        Upload Files
                    </Button>
                </div>
            </StyledHeader>

            <StyledFileExplorerContainer>
                <StorageExplorer
                    key={refreshCounter}
                    storageId={id}
                    expandedPaths={expandedPaths}
                    onToggleExpand={handleToggleExpand}
                    onSelect={handleFileSelect}
                    onDownload={handleDownload}
                    onTrashClick={handleDelete}
                    onDeleteMultiple={handleDeleteMultiple}
                    onDownloadMultiple={handleDownloadMultiple}
                />
            </StyledFileExplorerContainer>

            {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                    Selected: {selectedFile}
                </Typography>
            )}

            <Modal
                open={openPopUp}
                onClose={() => setOpenPopUp(false)}
                fullWidth
            >
                <Modal.Title>Upload Files</Modal.Title>
                <form onSubmit={handleUpload}>
                    <Modal.Content>
                        <Controller
                            name={'PROJECT_UPLOAD'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <FileDropzone
                                        multiple={true}
                                        value={field.value}
                                        extensions={[
                                            '.pdf',
                                            '.csv',
                                            '.txt',
                                            '.doc',
                                            '.ppt',
                                            '.docx',
                                            '.pptx',
                                        ]}
                                        disabled={isLoading}
                                        onChange={(newValues) => {
                                            field.onChange(newValues);
                                        }}
                                    />
                                );
                            }}
                        />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant={'outlined'}
                            disabled={isLoading}
                            onClick={() => setOpenPopUp(false)}
                        >
                            Close
                        </Button>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={isLoading}
                            startIcon={
                                isLoading ? (
                                    <CircularProgress size="1em" />
                                ) : (
                                    <></>
                                )
                            }
                        >
                            Upload
                        </Button>
                    </Modal.Actions>
                </form>
                {isLoading && <LinearProgress />}
            </Modal>
        </StyledContainer>
    );
};
