import { useEffect, useState } from 'react';
import { Actions, DockLocation, Layout, TabNode } from 'flexlayout-react';
import { useNotification, IconButton, Stack, Tooltip } from '@semoss/ui';
import {
    CloudSyncOutlined,
    CreateNewFolderOutlined,
    NoteAddOutlined,
    FileUpload,
    Refresh,
    PublishedWithChangesOutlined,
    CoffeeOutlined,
} from '@mui/icons-material';
import { usePixel, useWorkspace, useEngine } from '@/hooks';
import {
    FileExplorer,
    AddFileOverlay,
    CreateFileOverlay,
    DeleteFileOverlay,
} from '@/components/common';
import { Panel } from './Panel';

// Define supported mode
type ExplorerMode = 'app' | 'storage';

interface FileExplorerPanelProps {
    layout: Layout;
    mode?: ExplorerMode; // Optional prop to determine behavior
}
interface FileExplorerProps {
    fileName: string;
    fileSize: number;
    lastModified: string;
    key?: string; // only used in storage mode
}
export const FileExplorerPanel = (props: FileExplorerPanelProps) => {
    const { layout, mode = 'app' } = props; // Default to app mode
    const { workspace } = useWorkspace();
    const notification = useNotification();

    const [selectedPath, setSelectedPath] = useState<string>('');
    const [fileUploadPath, setFileUploadPath] = useState<string>('');
    const [counter, setCounter] = useState(0); // Used for refresh workaround
    const [overlayContent, setOverlayContent] = useState<React.ReactNode>(null);


    // Set upload path based on selected path
    useEffect(() => {
        let path = '/';
        if (selectedPath) {
            if (selectedPath.slice(-1) === '/') {
                path = selectedPath;
            } else {
                path = selectedPath.split('/').slice(0, -1).join('/');
            }
        }
        setFileUploadPath(path);
    }, [selectedPath]);

    const refreshFiles = () => {
        setCounter((prev) => prev + 1);
    };

    const closeOverlay = () => {
        setOverlayContent(null);
    };

    // Handle Upload
    const handleOpenAddFile = () => {
        setOverlayContent(
            <AddFileOverlay
                type="app"
                space={workspace.appId}
                onClose={async (success, uploadPath, file) => {
                    if (!success || !file) {
                        closeOverlay();
                        return;
                    }

                    if (mode !== 'storage') {
                        createPanel(uploadPath);
                        refreshFiles();
                        closeOverlay();
                        return;
                    }

                    try {
                        const engineId = useEngine();
                        if (!engineId) throw new Error('Engine not found');

                        const localFilePath = `/tmp/${file.name}`;

                        const query = `PushToStorage(storagePath='${uploadPath}', filePath='${localFilePath}', metadata=[{name:'${file.name}'}, {size:${file.size}}]);`;

                        // Log the query
                        console.log('Running Pixel Query:', query);

                        // Run pixel query
                        const responsedata = usePixel<FileExplorerProps[]>(query);

                        // Log full response for debugging
                        console.log('Pixel Response:', responsedata);

                        notification.add({
                            color: 'success',
                            message: `Successfully pushed ${file.name} to storage.`,
                        });

                        refreshFiles();
                    } catch (e: any) {
                        notification.add({ color: 'error', message: e.message });
                    } finally {
                        closeOverlay();
                    }
                }}
                uploadPath={fileUploadPath}
            />
        );
    };

    // Handle Create File/Folder (only available in app mode)
    const handleOpenCreateFile = (modeType: 'directory' | 'file') => {
        if (mode !== 'app') return;

        setOverlayContent(
            <CreateFileOverlay
                type="app"
                space={workspace.appId}
                onClose={(success, uploadPath) => {
                    if (success) {
                        createPanel(uploadPath);
                        refreshFiles();
                    }
                    closeOverlay();
                }}
                uploadPath={fileUploadPath}
                mode={modeType}
            />
        );
    };

    // Handle Trash/Delete (only available in app mode)
    const handleOnTrashClick = (fileDeletePath: string) => {
        if (mode !== 'app') return;

        setOverlayContent(
            <DeleteFileOverlay
                type="app"
                space={workspace.appId}
                onClose={(success) => {
                    if (success) {
                        removePanel(fileDeletePath);
                        refreshFiles();
                    }
                    closeOverlay();
                }}
                fileDeletePath={fileDeletePath}
            />
        );
    };

    // Select file and open editor tab
    const handleOnSelect = (path: string) => {
        const IsSelected = selectPanel(path);
        if (!IsSelected) {
            createPanel(path);
        }
        setSelectedPath(path);
    };

    // Drag & Drop (only available in app mode)
    const handleOnItemDragStart = (
        event: React.DragEvent<HTMLDivElement>,
        path: string,
    ) => {
        if (mode !== 'app') return;

        try {
            if (path.slice(-1) === '/') return;

            const model = workspace.selectedLayout?.model;
            if (!model) throw new Error('Missing model');

            if (!event.altKey) return;

            const name = path.split('/').pop();
            layout.addTabWithDragAndDrop(event as unknown as DragEvent, {
                type: 'tab',
                name: name,
                component: 'file-editor',
                config: { path },
                enableClose: true,
            });
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
        }
    };

    // Helper Functions

    const createPanel = (path: string): boolean => {
        try {
            if (!path || path.slice(-1) === '/') return false;

            const model = workspace.selectedLayout?.model;
            if (!model) throw new Error('Missing model');

            const addId =
                model.getActiveTabset()?.getId() ||
                model.getRoot().getChildren()[0]?.getId() ||
                '';

            const name = path.split('/').pop();
            model.doAction(
                Actions.addNode(
                    {
                        type: 'tab',
                        name: name,
                        component: 'file-editor',
                        config: { path },
                        enableClose: true,
                    },
                    addId,
                    DockLocation.CENTER,
                    -1,
                    true,
                ),
            );
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
            return false;
        }
        return true;
    };

    const selectPanel = (path: string): boolean => {
        try {
            if (!path || path.slice(-1) === '/') return false;

            const model = workspace.selectedLayout?.model;
            if (!model) throw new Error('Missing model');

            let selectedNode: TabNode | null = null;

            model.visitNodes((node) => {
                if (node instanceof TabNode && node.getComponent() === 'file-editor') {
                    const config = node.getConfig();
                    if (config.path === path) {
                        selectedNode = node;
                    }
                }
            });

            if (!selectedNode) return false;

            const selectedNodeId = selectedNode.getId();
            model.doAction(Actions.selectTab(selectedNodeId));
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
            return false;
        }
        return true;
    };

    const removePanel = (path: string) => {
        try {
            const model = workspace.selectedLayout?.model;
            if (!model) throw new Error('Missing model');

            const nodesToBeRemoved: TabNode[] = [];

            model.visitNodes((node) => {
                if (node instanceof TabNode && node.getComponent() === 'file-editor') {
                    const config = node.getConfig();
                    if (config.path.indexOf(path) === 0) {
                        nodesToBeRemoved.push(node);
                    }
                }
            });

            for (const n of nodesToBeRemoved) {
                model.doAction(Actions.deleteTab(n.getId()));
            }
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
        }
    };

    // App-specific actions only work in app mode
    const publishApp = async () => {
        if (mode !== 'app') return;
        try {
            workspace.setLoading(true);
            const response = await runPixel(
                `PublishProject(project='${workspace.appId}', release=true);`
            );


            notification.add({ color: 'success', message: 'Successfully published' });
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
        } finally {
            workspace.setLoading(false);
        }
    };

    const recompileApp = async () => {
        if (mode !== 'app') return;
        try {
            workspace.setLoading(true);
            const response = await runPixel(
                `ReloadInsightClasses(project='${workspace.appId}', release=false);`
            );

            notification.add({
                color: 'success',
                message: 'Successfully recompiled reactors. Remember to publish changes.',
            });
        } catch (e: any) {
            notification.add({ color: 'error', message: e.message });
        } finally {
            workspace.setLoading(false);
        }
    };

    return (
        <>
            <Panel
                actions={
                    <>
                        {/* Always show refresh */}
                        <IconButton
                            size={'small'}
                            color={'default'}
                            title={'Refresh'}
                            onClick={() => refreshFiles()}
                        >
                            <Refresh fontSize="inherit" />
                        </IconButton>

                        <Stack flex={1}>&nbsp;</Stack>

                        {/* App-specific actions */}
                        {mode === 'app' && (
                            <>
                                <Tooltip title={`Publish files`}>
                                    <IconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            publishApp();
                                        }}
                                    >
                                        <PublishedWithChangesOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={`Recompile reactors`}>
                                    <IconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            recompileApp();
                                        }}
                                    >
                                        <CoffeeOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={`Create new file at ${fileUploadPath}`}>
                                    <IconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenCreateFile('file');
                                        }}
                                    >
                                        <NoteAddOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={`Create new folder at ${fileUploadPath}`}>
                                    <IconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenCreateFile('directory');
                                        }}
                                    >
                                        <CreateNewFolderOutlined fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}

                        {/* Upload always available */}
                        <Tooltip title={`Upload file(s) to ${fileUploadPath}`}>
                            <IconButton
                                size={'small'}
                                color={'default'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddFile();
                                }}
                            >
                                <FileUpload fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    </>
                }
            >
                <FileExplorer
                    key={counter}
                    type={mode === 'storage' ? 'storage-catalog' : 'app'}
                    space="/"
                    insightId={workspace.insightId}
                    onSelect={(path) => handleOnSelect(path)}
                    onTrashClick={(e, path) => handleOnTrashClick(path)}
                    onDragStart={(e, path) => handleOnItemDragStart(e, path)}
                />
            </Panel>

            {/* Overlay Modal */}
            {overlayContent && (
                <div className="overlay-backdrop">
                    <div className="overlay-modal">{overlayContent}</div>
                </div>
            )}
        </>
    );
};

function runPixel(query: string) {
    throw new Error('Function not implemented.');
}
