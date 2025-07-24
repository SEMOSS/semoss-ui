import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { 
    Button, 
    styled, 
    Typography, 
    IconButton,
    Modal,
    LinearProgress,
    CircularProgress,
    useNotification,
    FileDropzone
} from '@semoss/ui';
import { CloudUploadOutlined, Refresh } from '@mui/icons-material';

import { FileExplorer } from '../common/File/FileExplorer';
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
    /** Storage engine ID */
    id: string;
}

type FileUploadForm = {
    PROJECT_UPLOAD: File[];
    STORAGE_PATH: string;
};

export const StorageFileExplorer = (props: StorageFileExplorerProps) => {
    const { id } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // Form for upload modal
    const { control, handleSubmit, setValue, watch } = useForm<FileUploadForm>({
        defaultValues: {
            PROJECT_UPLOAD: [],
            STORAGE_PATH: '/',
        },
    });

    const uploadedFiles = watch('PROJECT_UPLOAD');
    const storagePath = watch('STORAGE_PATH');

    /**
     * Refresh the file list
     */
    const refreshFiles = () => {
        setRefreshCounter((prev) => prev + 1);
    };

    /**
     * Toggle expansion of a directory
     */
    const handleToggleExpand = (path: string) => {
        setExpandedPaths((prev) => {
            if (prev.includes(path)) {
                return prev.filter((p) => p !== path);
            } else {
                return [...prev, path];
            }
        });
    };

    /**
     * Handle file selection
     */
    const handleFileSelect = (path: string) => {
        setSelectedFile(path);
        console.log('Selected file:', path);
    };

    /**
     * Handle file upload
     */
    const handleUpload = (storagePath: string, localFilePath: string) => {
        console.log(
            'Upload completed for storage path:',
            storagePath,
            'local file:',
            localFilePath,
        );
        // Refresh the file list after upload
        refreshFiles();
    };

    /**
     * Handle file download
     */
    const handleDownload = (path: string) => {
        console.log('Download initiated for path:', path);
        // In a real implementation, you might want to show download progress
        // or a success notification
    };

    /**
     * Handle file deletion
     */
    const handleDelete = (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => {
        console.log('File deleted:', path);
        // Remove from expanded paths if it was a directory
        setExpandedPaths((prev) => prev.filter((p) => !p.startsWith(path)));
        // Clear selection if the deleted file was selected
        if (selectedFile === path) {
            setSelectedFile('');
        }
        // Refresh the file list after deletion
        refreshFiles();
    };

    /**
     * Handle file upload to storage
     */
    const handleUploadToStorage = handleSubmit(async (data: FileUploadForm) => {
        setIsUploading(true);

        try {
            // Upload files to the server first
            const upload = await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                configStore.store.insightID,
            );

            // For each uploaded file, push to storage
            for (const file of upload) {
                const { fileLocation } = file;
                const fileName = fileLocation.split('/').pop() || 'unknown';
                const storageFilePath = `${data.STORAGE_PATH}/${fileName}`.replace(/\/+/g, '/');

                // Push file to storage using the storage pixel
                const response = await monolithStore.runQuery(`
                    Storage(storage = "${id}") | PushToStorage(storagePath="${storageFilePath}", filePath="${fileLocation}");
                `);

                const { output, operationType } = response.pixelReturn[0];

                if (operationType.indexOf('ERROR') !== -1) {
                    notification.add({
                        color: 'error',
                        message: `Failed to upload ${fileName}: ${output}`,
                    });
                } else {
                    notification.add({
                        color: 'success',
                        message: `Successfully uploaded ${fileName} to storage`,
                    });
                }
            }

            // Close modal and refresh
            setUploadModalOpen(false);
            setValue('PROJECT_UPLOAD', []);
            setValue('STORAGE_PATH', '/');
            refreshFiles();

        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setIsUploading(false);
        }
    });

    /**
     * Handle global upload button click
     */
    const handleGlobalUpload = () => {
        setUploadModalOpen(true);
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
                        onClick={handleGlobalUpload}
                        size="small"
                    >
                        Upload Files
                    </Button>
                </div>
            </StyledHeader>

            <StyledFileExplorerContainer>
                <FileExplorer
                    key={refreshCounter}
                    type="storage"
                    storageId={id}
                    expandedPaths={expandedPaths}
                    onToggleExpand={handleToggleExpand}
                    onSelect={handleFileSelect}
                    onUpload={handleUpload}
                    onDownload={handleDownload}
                    onTrashClick={handleDelete}
                />
            </StyledFileExplorerContainer>

            {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                    Selected: {selectedFile}
                </Typography>
            )}

            {/* Upload Modal */}
            <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} fullWidth>
                <Modal.Title>Upload Files to Storage</Modal.Title>
                <form onSubmit={handleUploadToStorage}>
                    <Modal.Content>
                        <Controller
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
                            render={({ field }) => (
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
                                        '.jpg',
                                        '.jpeg',
                                        '.png',
                                        '.gif',
                                        '.mp4',
                                        '.mp3',
                                        '.zip',
                                        '.rar'
                                    ]}
                                    disabled={isUploading}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                    }}
                                />
                            )}
                        />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant="outlined"
                            disabled={isUploading}
                            onClick={() => setUploadModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isUploading || uploadedFiles.length === 0}
                            startIcon={
                                isUploading ? (
                                    <CircularProgress size="1em" />
                                ) : (
                                    <CloudUploadOutlined />
                                )
                            }
                        >
                            {isUploading ? 'Uploading...' : 'Upload to Storage'}
                        </Button>
                    </Modal.Actions>
                </form>
                {isUploading && <LinearProgress />}
            </Modal>
        </StyledContainer>
    );
};