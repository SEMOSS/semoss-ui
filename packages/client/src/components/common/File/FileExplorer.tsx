import React from 'react';
import { Icon, TreeView, styled } from '@semoss/ui';
import { ExpandMore, ChevronRight } from '@mui/icons-material';

import { usePixel, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { FileExplorerItem } from './FileExplorerItem';

const StyledTreeView = styled(TreeView)(({ theme }) => ({
    width: '100%',
    maxHeight: '100%',
    gap: theme.spacing(3),
    '.MuiTreeItem-content': {
        padding: theme.spacing(0.5),
    },
    overflow: 'auto',
}));

interface FileExplorerProps {
    expandedPaths: string[];
    onToggleExpand: (path: string) => void;
    /** Type of file opened */
    type: 'app' | 'insight' | 'storage';

    /** Space where the file is located */
    space?: string;

    /** Storage engine ID (for storage type) */
    storageId?: string;

    /** insight id */
    insightId?: string | null;

    /** Trigger a callback when an file is selected */
    onSelect?: (path: string) => void;

    /** Triggered when the Label starts dragging */
    onDragStart?: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

    /** Triggered when the item ends dragging */
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

    /** Triggered when the Track Icon is clicked */
    onTrashClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => void;

    /** Triggered when upload is requested (storage only) */
    onUpload?: (storagePath: string, localFilePath: string) => void;

    /** Triggered when download is requested (storage only) */
    onDownload?: (path: string) => void;
}

export const FileExplorer = (props: FileExplorerProps) => {
    const {
        type,
        space,
        storageId,
        insightId = null,
        onSelect = () => null,
        onDragStart = () => null,
        onDragEnd = () => null,
        onTrashClick = () => null,
        onUpload = () => null,
        onDownload = () => null,
        expandedPaths,
        onToggleExpand,
    } = props;

    const { monolithStore, configStore } = useRootStore();

    // Get assets for app/insight types
    const getAssets = usePixel<
        {
            lastModified: string;
            name: string;
            path: string;
            type: 'directory' | 'file';
        }[]
    >(
        type === 'app'
            ? `BrowseAsset(filePath=["version/assets"], space=["${space}"]);`
            : '',
        {},
        insightId,
    );

    // Get storage files for storage type
    const getStorageFiles = usePixel<string[]>(
        type === 'storage'
            ? `Storage(storage = "${storageId}") | ListStoragePath(storagePath='/');`
            : '',
    );

    const initLoadComplete =
        type === 'storage'
            ? getStorageFiles.status === 'SUCCESS'
            : getAssets.status === 'SUCCESS';
    const [selected, setSelected] = React.useState<string[]>([]);

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
        if (type !== 'storage') return;

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

    /**
     * Handle file upload for storage
     */
    const handleUpload = async (storagePath: string, localFilePath: string) => {
        if (type !== 'storage') return;

        const uploadQuery = `Storage("${storageId}") | PushToStorage(storagePath="${storagePath}", filePath="${localFilePath}");`;

        try {
            const response = await monolithStore.runQuery(uploadQuery);
            console.log('Upload response:', response);
            onUpload(storagePath, localFilePath);
        } catch (e) {
            console.error('Upload error:', e);
        }
    };

    /**
     * Handle file download for storage
     */
    const handleDownload = async (filePath: string) => {
        if (type !== 'storage') return;

        try {
            // Use a simpler approach: pull the file and then download it
            const downloadQuery = `Storage("${storageId}") | PullFromStorage(storagePath="${filePath}", filePath="/") | DownloadAsset(filePath=["/${filePath
                .split('/')
                .pop()}"], space=["insight"]);`;
            const response = await monolithStore.runQuery(downloadQuery);
            console.log('Download response:', response);

            // Get the file key from the response
            const fileKey = response.pixelReturn[0]?.output;

            if (!fileKey) {
                throw new Error('Failed to get file key for download');
            }

            // Use the existing download mechanism to trigger browser download
            await monolithStore.download(configStore.store.insightID, fileKey);

            onDownload(filePath);
        } catch (e) {
            console.error('Download error:', e);
            // You might want to show a notification here
        }
    };

    if (!initLoadComplete) {
        return (
            <LoadingScreen.Trigger
                description={
                    type === 'storage'
                        ? 'Retrieving files from storage...'
                        : 'Retrieving files from application...'
                }
            />
        );
    }

    // Transform storage files into structured format
    const files =
        type === 'storage' && getStorageFiles.status === 'SUCCESS'
            ? getStorageFiles.data.map((filePath) => {
                  const pathParts = filePath.split('/').filter(Boolean);
                  const name = pathParts[pathParts.length - 1] || filePath;
                  const isDirectory = filePath.endsWith('/');

                  return {
                      name,
                      path: filePath,
                      type: isDirectory ? 'directory' : 'file',
                      lastModified: '', // Storage API doesn't provide this
                  };
              })
            : getAssets.status === 'SUCCESS'
            ? getAssets.data
            : [];

    return (
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
                {(type === 'storage'
                    ? (getStorageFiles.status === 'INITIAL' || getStorageFiles.status === 'LOADING')
                    : (getAssets.status === 'INITIAL' || getAssets.status === 'LOADING')
                ) ? (
                    <LoadingScreen.Trigger />
                ) : (type === 'storage' ? getStorageFiles.status === 'SUCCESS' : getAssets.status === 'SUCCESS') ? (
                    files.map((n) => {
                        return (
                            <FileExplorerItem
                                key={n.path}
                                type={type}
                                space={space}
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
                                    type === 'storage' ? handleDelete(path) : onTrashClick(e, path);
                                }}
                                onUpload={(storagePath, localPath) => {
                                    handleUpload(storagePath, localPath);
                                }}
                                onDownload={(path) => {
                                    handleDownload(path);
                                }}
                            />
                        );
                    })
                ) : null}
            </LoadingScreen>
        </StyledTreeView>
    );
};
