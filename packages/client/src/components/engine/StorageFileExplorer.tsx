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
    Icon,
    TreeView,
} from '@semoss/ui';
import { CloudUploadOutlined, Refresh, ExpandMore, ChevronRight, DeleteOutline, CloudDownloadOutlined } from '@mui/icons-material';

import { StorageExplorerItem } from './StorageExplorerItem';
import { Controller, useForm } from 'react-hook-form';
import { useRootStore, usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

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

const StyledTreeView = styled(TreeView)(({ theme }) => ({
    width: '100%',
    maxHeight: '100%',
    gap: theme.spacing(3),
    '.MuiTreeItem-content': {
        padding: theme.spacing(0.5),
    },
    overflow: 'auto',
}));

const StyledTreeHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface StorageFileExplorerProps {
    id: string;
}

type FileUploadForm = {
    PROJECT_UPLOAD: File[];
};

export const StorageFileExplorer = (props: StorageFileExplorerProps) => {
    const { id } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [openPopUp, setOpenPopUp] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const [selected, setSelected] = useState<string[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const getStorageFiles = usePixel<string[]>(
        `Storage(storage = "${id}") | ListStoragePath(storagePath='/');`,
    );

    const initLoadComplete = getStorageFiles.status === 'SUCCESS';

    const refreshFiles = () => {
        getStorageFiles.refresh();
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

    const handleOnNodeSelect = (selected: string[]) => {
        handleFileSelect(selected[0] || '');
        setSelected(selected);
    };

    const { control, setValue, handleSubmit } = useForm<{
        PROJECT_UPLOAD: File[];
    }>({
        defaultValues: {
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
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
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

    const handleDelete = async (filePath: string) => {
        const deleteQuery = `Storage(storage = "${id}") |
        DeleteFromStorage(storagePath="${filePath}", leaveFolderStructure=false);`;

        try {
            const response = await monolithStore.runQuery(deleteQuery);
            console.log('Delete response:', response);
            handleTrashClick({} as React.MouseEvent<HTMLButtonElement>, filePath);
            refreshFiles();
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const handleDeleteMultiple = async () => {
        if (selected.length === 0) return;

        const pathsString = selected.map((path) => `"${path}"`).join(', ');
        const deleteQuery = `Storage(storage = "${id}") |
        DeleteFromStorage(storagePaths=[${pathsString}], leaveFolderStructure=false);`;

        try {
            const response = await monolithStore.runQuery(deleteQuery);
            console.log('Delete multiple response:', response);

            handleDeleteMultipleFiles(selected);
            setSelected([]);
            setShowDeleteDialog(false);
            refreshFiles();
        } catch (e) {
            console.error('Delete multiple error:', e);
        }
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

    const handleDownloadMultiple = async () => {
        if (selected.length === 0) return;

        try {
            const downloadedFiles: string[] = [];
            
            for (const path of selected) {
                if (path.endsWith('/')) {
                    throw new Error(
                        'Cannot download directories. Please select files only.',
                    );
                }

                const filename = extractFilename(path);
                const downloadQuery = `Storage("${id}") | PullFromStorage(storagePath="${path}", filePath="${filename}");`;

                console.log('Downloading file:', path);
                await monolithStore.runQuery(downloadQuery);
                downloadedFiles.push(filename);
            }

            if (downloadedFiles.length > 0) {
                const filePathsString = downloadedFiles
                    .map((file) => `"${file}"`)
                    .join(', ');
                const zipQuery = `ZipFiles(filePaths=[${filePathsString}], filePath="multiple_files.zip") | DownloadAsset(filePath=["multiple_files.zip"], space=["insight"]);`;

                console.log('Creating zip file with downloaded files');
                const response = await monolithStore.runQuery(zipQuery);
                console.log('Zip response:', response);

                const fileKey = response.pixelReturn[0]?.output;

                if (!fileKey) {
                    throw new Error(
                        'Failed to get file key for download. The files may not exist or there was a server error.',
                    );
                }

                await monolithStore.download(
                    configStore.store.insightID,
                    fileKey,
                );

                handleDownloadMultipleFiles(selected);
                setSelected([]);
            }
        } catch (e) {
            console.error('Download multiple error:', e);

            let errorMessage = 'ZIP download failed: ';
            if (e instanceof Error) {
                if (e.message.includes('directory')) {
                    errorMessage +=
                        'Cannot download directories. Please select files only.';
                } else if (e.message.includes('file key')) {
                    errorMessage += 'Files not found or server error occurred.';
                } else if (
                    e.message.includes('network') ||
                    e.message.includes('fetch')
                ) {
                    errorMessage +=
                        'Network error. Please check your connection and try again.';
                } else {
                    errorMessage += e.message;
                }
            } else {
                errorMessage += 'An unexpected error occurred.';
            }

            console.error(errorMessage);
        }
    };

    const handleTrashClick = (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => {
        console.log('File deleted:', path);

        setExpandedPaths((prev) => prev.filter((p) => !p.startsWith(path)));

        if (selectedFile === path) {
            setSelectedFile('');
        }
    };

    const handleDeleteMultipleFiles = (paths: string[]) => {
        console.log('Multiple files deleted:', paths);
        paths.forEach((path) => {
            setExpandedPaths((prev) => prev.filter((p) => !p.startsWith(path)));
            if (selectedFile === path) {
                setSelectedFile('');
            }
        });
    };

    const handleDownloadMultipleFiles = (paths: string[]) => {
        console.log('Multiple files downloaded:', paths);
        paths.forEach((path) => {
            handleDownload(path);
        });
    };

    if (!initLoadComplete) {
        return (
            <LoadingScreen.Trigger description="Retrieving files from storage..." />
        );
    }

    const files =
        getStorageFiles.status === 'SUCCESS'
            ? getStorageFiles.data.map((filePath) => {
                  const pathParts = filePath.split('/').filter(Boolean);
                  const name = pathParts[pathParts.length - 1] || filePath;
                  const isDirectory = filePath.endsWith('/');

                  return {
                      name,
                      path: filePath,
                      type: isDirectory ? 'directory' : 'file',
                      lastModified: '',
                  };
              })
            : [];

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
                <StyledTreeHeader>
                    <Typography variant="body2" color="textSecondary">
                        {selected.length > 0 ? `${selected.length} item(s) selected` : 'No items selected'}
                    </Typography>
                    {selected.length > 0 && (
                        <>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<CloudDownloadOutlined />}
                                size="small"
                                onClick={handleDownloadMultiple}
                            >
                                Download Selected
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutline />}
                                size="small"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                Delete Selected
                            </Button>
                        </>
                    )}
                </StyledTreeHeader>
                <StyledTreeView
                    multiSelect
                    expanded={expandedPaths}
                    selected={selected}
                    onNodeToggle={(e, nodeIds) => {
                        const lastToggled =
                            nodeIds.find((id) => !expandedPaths.includes(id)) ||
                            expandedPaths.find((id) => !nodeIds.includes(id));
                        if (lastToggled) {
                            handleToggleExpand(lastToggled);
                        }
                    }}
                    onNodeSelect={(e, v) => {
                        handleOnNodeSelect(v);
                    }}
                    defaultCollapseIcon={
                        <Icon color={'disabled'}>
                            <ExpandMore />
                        </Icon>
                    }
                    defaultExpandIcon={
                        <Icon color={'disabled'}>
                            <ChevronRight />
                        </Icon>
                    }
                >
                    {getStorageFiles.status === 'INITIAL' ||
                    getStorageFiles.status === 'LOADING' ? (
                        <LoadingScreen>
                            <LoadingScreen.Trigger />
                        </LoadingScreen>
                    ) : getStorageFiles.status === 'SUCCESS' ? (
                        <div key={refreshCounter}>
                            {files.map((n) => {
                                return (
                                    <StorageExplorerItem
                                        key={n.path}
                                        storageId={id}
                                        name={n.name}
                                        path={n.path}
                                        isDirectory={n.type === 'directory'}
                                        lastModified={n.lastModified}
                                        expanded={expandedPaths}
                                        selected={selected}
                                        onTrashClick={(e, path) => {
                                            handleDelete(path);
                                        }}
                                        onDownload={(path) => {
                                            handleDownload(path);
                                        }}
                                        onSelect={(path, isSelected) => {
                                            let newSelected = [...selected];
                                            if (isSelected) {
                                                if (!newSelected.includes(path)) {
                                                    newSelected.push(path);
                                                }
                                            } else {
                                                newSelected = newSelected.filter(
                                                    (p) => p !== path,
                                                );
                                            }
                                            handleOnNodeSelect(newSelected);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ) : null}
                </StyledTreeView>
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
                            name="STORAGE_PATH"
                            control={control}
                            rules={{ required: 'Storage path is required' }}
                            render={({ field, fieldState }) => (
                                <div style={{ marginBottom: '16px' }}>
                                    <Typography variant="body2" style={{ marginBottom: '8px' }}>
                                        Storage Path (e.g., /documents, /images):
                                    </Typography>
                                    <input
                                        {...field}
                                        type="text"
                                        placeholder="/"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    {fieldState.error && (
                                        <Typography variant="caption" color="error">
                                            {fieldState.error.message}
                                        </Typography>
                                    )}
                                </div>
                            )}
                        />
                        <Controller
                            name="PROJECT_UPLOAD"
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

            <Modal open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <Modal.Title>Confirm Delete</Modal.Title>
                <Modal.Content>
                    <Typography variant="body1">
                        Are you sure you want to delete {selected.length} selected item(s)?
                        This action cannot be undone.
                    </Typography>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteMultiple} color="error" variant="contained">
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledContainer>
    );
};
