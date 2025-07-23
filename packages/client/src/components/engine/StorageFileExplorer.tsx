import React, { useState } from 'react';
import { Button, styled, Typography, IconButton } from '@semoss/ui';
import { CloudUploadOutlined, Refresh } from '@mui/icons-material';

import { FileExplorer } from '../common/File/FileExplorer';

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

export const StorageFileExplorer = (props: StorageFileExplorerProps) => {
    const { id } = props;
    
    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [refreshCounter, setRefreshCounter] = useState(0);

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
     * Handle global upload button click
     */
    const handleGlobalUpload = () => {
        // In a real implementation, this would open a file picker
        // and upload to the root directory
        console.log('Global upload clicked');
        console.log('test');
        alert('todo - global upload functionality');
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
        </StyledContainer>
    );
};