import React from 'react';
import { Icon, TreeView, styled, Button, Modal, Typography } from '@semoss/ui';
import { ExpandMore, ChevronRight, DeleteOutline, CloudDownloadOutlined } from '@mui/icons-material';

import { usePixel, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { StorageExplorerItem } from './StorageExplorerItem';

const StyledTreeView = styled(TreeView)(({ theme }) => ({
    width: '100%',
    maxHeight: '100%',
    gap: theme.spacing(3),
    '.MuiTreeItem-content': {
        padding: theme.spacing(0.5),
    },
    overflow: 'auto',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

interface StorageExplorerProps {
    expandedPaths: string[];
    onToggleExpand: (path: string) => void;
    /** Storage engine ID */
    storageId: string;

    /** Trigger a callback when a file is selected */
    onSelect?: (path: string) => void;
    /** Triggered when the Label starts dragging */
    onDragStart?: (
        event: React.DragEvent<HTMLDivElement>,
        path: string,
    ) => void;
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

    /** Triggered when the Track Icon is clicked */
    onTrashClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => void;

    /** Triggered when upload is requested */
    onUpload?: (storagePath: string, localFilePath: string) => void;

    /** Triggered when download is requested */
    onDownload?: (path: string) => void;
    onDeleteMultiple?: (paths: string[]) => void;
    /** Triggered when download multiple is requested */
    onDownloadMultiple?: (paths: string[]) => void;
}

export const StorageExplorer = (props: StorageExplorerProps) => {
    const {
        storageId,
        onSelect = () => null,
        onDragStart = () => null,
        onDragEnd = () => null,
        onTrashClick = () => null,
        onUpload = () => null,
        onDownload = () => null,
        onDeleteMultiple = () => null,
        onDownloadMultiple = () => null,
        expandedPaths,
        onToggleExpand,
    } = props;

    const { monolithStore, configStore } = useRootStore();

    // Get storage files
    const getStorageFiles = usePixel<string[]>(
        `Storage(storage = "${storageId}") | ListStoragePath(storagePath='/');`,
    );

    const initLoadComplete = getStorageFiles.status === 'SUCCESS';
    const [selected, setSelected] = React.useState<string[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [filesToDelete, setFilesToDelete] = React.useState<string[]>([]);

    /**
     * Triggered when a node is selected
     * @param selected - newly selected values
     */
    const handleOnNodeSelect = (selected: string[]) => {
        // trigger the callback on the first one
        onSelect(selected[0] || '');

        // set the selected values
        setSelected(selected);
    };

    /**
     * Handle file deletion for storage
     */
    const handleDelete = async (filePath: string) => {
        const deleteQuery = `Storage(storage = "${storageId}") |
        DeleteFromStorage(storagePath="${filePath}", leaveFolderStructure=false);`;

        try {
            const response = await monolithStore.runQuery(deleteQuery);
            console.log('Delete response:', response);
            // Trigger the parent's callback
            onTrashClick({} as React.MouseEvent<HTMLButtonElement>, filePath);
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const handleDeleteMultiple = async () => {
        if (selected.length === 0) return;

        const pathsString = selected.map((path) => `"${path}"`).join(', ');
        const deleteQuery = `Storage(storage = "${storageId}") |
        DeleteFromStorage(storagePaths=[${pathsString}], leaveFolderStructure=false);`;

        try {
            const response = await monolithStore.runQuery(deleteQuery);
            console.log('Delete multiple response:', response);

            onDeleteMultiple(selected);
            setSelected([]);
            setShowDeleteDialog(false);
        } catch (e) {
            console.error('Delete multiple error:', e);
        }
    };

    const handleUpload = async (storagePath: string, localFilePath: string) => {
        const uploadQuery = `Storage("${storageId}") | PushToStorage(storagePath="${storagePath}", filePath="${localFilePath}");`;

        try {
            const response = await monolithStore.runQuery(uploadQuery);
            console.log('Upload response:', response);
            onUpload(storagePath, localFilePath);
        } catch (e) {
            console.error('Upload error:', e);
        }
    };

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

    /**
     * Handle file download for storage
     */
    const handleDownload = async (filePath: string) => {
        try {
            const filename = extractFilename(filePath);

            if (filePath.endsWith('/')) {
                throw new Error(
                    'Cannot download a directory. Please select a file.',
                );
            }

            const downloadQuery = `Storage("${storageId}") | PullFromStorage(storagePath="${filePath}", filePath="${filename}") | DownloadAsset(filePath=["${filename}"], space=["insight"]);`;

            console.log('Download query:', downloadQuery);
            const response = await monolithStore.runQuery(downloadQuery);
            console.log('Download response:', response);

            const fileKey = response.pixelReturn[0]?.output;

            if (!fileKey) {
                throw new Error(
                    'Failed to get file key for download. The file may not exist or there was a server error.',
                );
            }

            await monolithStore.download(configStore.store.insightID, fileKey);

            onDownload(filePath);
        } catch (e) {
            console.error('Download error:', e);

            let errorMessage = 'Download failed: ';
            if (e instanceof Error) {
                if (e.message.includes('directory')) {
                    errorMessage +=
                        'Cannot download directories. Please select a file.';
                } else if (e.message.includes('file key')) {
                    errorMessage += 'File not found or server error occurred.';
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

    const handleDownloadMultiple = async () => {
        if (selected.length === 0) return;

        try {
            const pathsString = selected.map((path) => `"${path}"`).join(', ');
            const downloadQuery = `Storage("${storageId}") | PullMultipleFromStorageAndZip(storagePaths=[${pathsString}], filePath="multiple_files.zip") | DownloadAsset(filePath=["multiple_files.zip"], space=["insight"]);`;

            console.log('Download multiple query:', downloadQuery);
            const response = await monolithStore.runQuery(downloadQuery);
            console.log('Download multiple response:', response);

            const fileKey = response.pixelReturn[0]?.output;

            if (!fileKey) {
                throw new Error(
                    'Failed to get file key for download. The files may not exist or there was a server error.',
                );
            }

            await monolithStore.download(configStore.store.insightID, fileKey);

            onDownloadMultiple(selected);
            setSelected([]);
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
        <>
            <StyledHeader>
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
                            Download as ZIP
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
            </StyledHeader>
            <StyledTreeView
                multiSelect
                expanded={expandedPaths}
                selected={selected}
                onNodeToggle={(e, nodeIds) => {
                    const lastToggled =
                        nodeIds.find((id) => !expandedPaths.includes(id)) ||
                        expandedPaths.find((id) => !nodeIds.includes(id));
                    if (lastToggled) {
                        onToggleExpand(lastToggled);
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
                <LoadingScreen>
                    {getStorageFiles.status === 'INITIAL' ||
                    getStorageFiles.status === 'LOADING' ? (
                        <LoadingScreen.Trigger />
                    ) : getStorageFiles.status === 'SUCCESS' ? (
                        files.map((n) => {
                            return (
                                <StorageExplorerItem
                                    key={n.path}
                                    storageId={storageId}
                                    name={n.name}
                                    path={n.path}
                                    isDirectory={n.type === 'directory'}
                                    lastModified={n.lastModified}
                                    expanded={expandedPaths}
                                    selected={selected}
                                    onDragStart={(e, path) => {
                                        onDragStart(e, path);
                                    }}
                                    onDragEnd={(e, path) => {
                                        onDragEnd(e, path);
                                    }}
                                    onTrashClick={(e, path) => {
                                        handleDelete(path);
                                    }}
                                    onUpload={(storagePath, localPath) => {
                                        handleUpload(storagePath, localPath);
                                    }}
                                    onDownload={(path) => {
                                        handleDownload(path);
                                    }}
                                    onDownloadMultiple={(paths) => {
                                        handleDownloadMultiple();
                                    }}
                                    onSelect={(path, isSelected) => {
                                        let newSelected = [...selected];
                                        if (isSelected) {
                                            // Add to selection if not already selected
                                            if (!newSelected.includes(path)) {
                                                newSelected.push(path);
                                            }
                                        } else {
                                            // Remove from selection if already selected
                                            newSelected = newSelected.filter(
                                                (p) => p !== path,
                                            );
                                        }
                                        handleOnNodeSelect(newSelected);
                                    }}
                                />
                            );
                        })
                    ) : null}
                </LoadingScreen>
            </StyledTreeView>

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
        </>
    );
}; 