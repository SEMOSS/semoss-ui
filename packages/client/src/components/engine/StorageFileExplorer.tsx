import React, { useState } from 'react';
import { Button, styled, Typography, IconButton, Modal, FileDropzone, CircularProgress, LinearProgress, useNotification } from '@semoss/ui';
import { CloudUploadOutlined, Refresh } from '@mui/icons-material';

import { FileExplorer } from '../common/File/FileExplorer';
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
    /** Storage engine ID */
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
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();


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
     * 
     */

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
        console.log("data: ", data);

        try{            
            const upload = await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                configStore.store.insightID,
            );

            console.log(configStore.store.insightID);

            upload.map(async (file, index) => {
                let fileLocation = file.fileLocation.replace(/\\/g, '/');
                if (index + 1 === upload.length) {
                    fileLocations = fileLocations += `"${fileLocation}"`;
                } else {
                    fileLocations = fileLocations += `"${fileLocation}", `;
                }        
            });

            console.log("location:", fileLocations);

            const response = await monolithStore.runQuery(`
            Storage(storage = "${id}") | SyncLocalToStorage(storagePath='/', filePath=[${fileLocations}]);
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
        }
        catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            //turn off loading
            refreshFiles();
            setIsLoading(false);
            setValue('PROJECT_UPLOAD', []);
            setOpenPopUp(false);
        }

       
        // Refresh the file list after upload
        
    });

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
                
                let storageFilePath;
                if (data.STORAGE_PATH === '/' || data.STORAGE_PATH === '') {
                    storageFilePath = `/${fileName}`;
                    console.log(`Uploading to root: ${storageFilePath}`);
                } else {
                    storageFilePath = `${data.STORAGE_PATH}/${fileName}`.replace(/\/+/g, '/');
                    console.log(`Uploading to folder: ${storageFilePath}`);
                }

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
                        // onClick={handleGlobalUpload}
                        onClick={() => setOpenPopUp(true)}
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
                    // onUpload={handleUpload}
                    onDownload={handleDownload}
                    onTrashClick={handleDelete}
                />
            </StyledFileExplorerContainer>

            {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                    Selected: {selectedFile}
                </Typography>
            )}

            <Modal open={openPopUp} onClose={() => setOpenPopUp(false)} fullWidth>
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