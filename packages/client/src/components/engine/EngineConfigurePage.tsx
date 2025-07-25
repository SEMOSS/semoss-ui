import { useEffect, useState } from 'react';
import {
    styled,
    Stack,
    Chip,
    Typography,
    Tooltip,
    IconButton,
    useNotification,
    Modal,
    Paper,
    Search,
} from '@semoss/ui';
import {
    CreateNewFolderOutlined,
    FileUploadOutlined,
    NoteAddOutlined,
} from '@mui/icons-material';
import { CSS } from '@dnd-kit/utilities';
import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEngine } from '@/hooks';
import { EngineFileEditor } from './EngineFileEditor';
import { EngineFileExplorer } from './EngineFileExplorer';
import { EngineCreateFileOverlay } from './Modal/EngineCreateFileOverlay';
import { EngineDeleteFileOverlay } from './Modal/EngineDeleteFileOverlay';
import { EngineAddFileOverlay } from './Modal/EngineAddFileOverlay';

const EXPLORER_TYPE = 'engine';

type AssetItem = {
    lastModified: string;
    name: string;
    path: string;
    type: 'directory' | 'file';
};

const StyledLayout = styled(Stack)(() => ({
    background: '#fff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: '-16px',
    paddingTop: '14px',
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    background: '#fff',
}));

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    borderRadius: '0',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '30%',
    },
    height: '100%',
    zIndex: 2,
}));

const StyledHeaderChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.primary.dark,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.primary.dark,
}));

const StyledFilterSearchContainer = styled('div')({});

const StyledIconHeader = styled('div')({
    display: 'flex',
    alignItems: 'center',
});

const StyledIconGroup = styled('div')({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    padding: '8px 0',
});

const StyledIconButton = styled(IconButton)({
    padding: '0 0 0 8px',
    '&:hover': {
        backgroundColor: 'transparent',
    },
});

export const EngineConfigurePage = () => {
    const notification = useNotification();
    const { active } = useEngine();
    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [assetData, setAssetData] = useState<AssetItem[] | []>(null);
    // files to add
    const [selectedPath, setSelectedPath] = useState<string>('');
    const [fileUploadPath, setFileUploadPath] = useState<string>('');
    const [showAddFileModal, setShowAddFileModal] = useState(false);
    const [showCreateFileModal, setShowCreateFileModal] = useState(false);
    const [createMode, setCreateMode] = useState<'directory' | 'file'>('file');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileDeletePath, setFileDeletePath] = useState<string>('');
    const [fileList, setFileList] = useState<string[]>([]);
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        if (!selectedPath) {
            setFileUploadPath('./');
            return;
        }

        // Normalize path
        const rawPath = selectedPath.replace(/\\/g, '/');
        const parts = rawPath.split('/').filter(Boolean);

        let path = '';
        const isFile =
            parts.length > 0 && parts[parts.length - 1].includes('.');

        if (isFile) {
            // remove filename
            path = parts.slice(0, -1).join('/');
        } else {
            path = parts.join('/');
        }

        const finalPath = path ? `./${path}` : './';

        setFileUploadPath(finalPath);
    }, [selectedPath]);

    const handleOnSelect = (path: string) => {
        const IsSelected = selectPanel(path);
        if (!IsSelected) {
            createPanel(path);
        }
        setSelectedPath(path);
    };

    const handleFileClose = (filePathToRemove: string) => {
        setFileList((prevList) => {
            const updatedList = prevList.filter(
                (file) => file !== filePathToRemove,
            );

            // If the removed file is currently selected, switch to another
            if (selectedPath === filePathToRemove) {
                const fallbackFile = updatedList[0] || '';
                setSelectedPath(fallbackFile);
            }

            return updatedList;
        });
    };

    const handleOpenAddFile = () => {
        setShowAddFileModal(true);
    };

    const handleOpenCreateFile = (mode: 'directory' | 'file') => {
        setCreateMode(mode);
        setShowCreateFileModal(true);
    };

    const createPanel = (path: string): boolean => {
        try {
            if (!path) {
                return false;
            }

            if (path.slice(-1) === '/') {
                return false;
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    const selectPanel = (path: string): boolean => {
        try {
            if (!path) {
                return false;
            }

            if (path.slice(-1) === '/') {
                return false;
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    const removePanel = (path: string) => {
        try {
            if (!path) {
                return;
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });
        }
    };

    const handleOnTrashClick = (path: string) => {
        setFileDeletePath(path);
        setShowDeleteModal(true);
    };

    const handleDataLoad = (data: AssetItem[]) => {
        setAssetData(data);
    };

    const handleToggleExpand = (path: string) => {
        setExpandedPaths((prev) =>
            prev.includes(path)
                ? prev.filter((p) => p !== path)
                : [...prev, path],
        );
    };

    useEffect(() => {
        if (Array.isArray(assetData)) {
            const fileNames = assetData.map((f) => f.name);
            setFileList(fileNames);
            const initialFile = assetData.find(
                (f: AssetItem) => f.type !== 'directory' && f.path,
            );
            if (initialFile) {
                const normalizedPath = initialFile.path.replace(/\\/g, '/');
                setSelectedPath(normalizedPath);
            }
        }
    }, [assetData]);

    const refreshFiles = () => {
        setCounter((prev) => prev + 1);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
    );

    const SortableChip = ({
        filePath,
        fileName,
        isSelected,
        onClick,
        onDelete,
    }: any) => {
        const { attributes, listeners, setNodeRef, transform } = useSortable({
            id: filePath,
        });

        const style = {
            transform: CSS.Translate.toString(transform),
        };

        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Chip with click & delete */}
                <StyledChip
                    label={fileName}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    onDelete={
                        isSelected || isHovered
                            ? (e) => {
                                  e.stopPropagation();
                                  onDelete();
                              }
                            : undefined
                    }
                    sx={{
                        backgroundColor: isSelected ? '#EBF4FE' : 'default',
                        color: isSelected ? '#1260DD' : 'default',
                        cursor: 'default',
                    }}
                />
            </div>
        );
    };

    return (
        <div>
            <StyledLayout>
                <Stack direction="row">
                    <StyledSidebar>
                        <Stack direction="row" spacing={1}>
                            <StyledHeaderChip label="Files" size="small" />
                        </Stack>
                        <StyledFilterSearchContainer>
                            <Search
                                size="small"
                                placeholder="Search"
                                value=""
                                sx={{ width: '100%' }}
                            />
                        </StyledFilterSearchContainer>
                        <StyledIconHeader>
                            <Typography
                                variant="body1"
                                sx={{ color: '#212121' }}
                            >
                                Files
                            </Typography>
                            <StyledIconGroup>
                                <Tooltip
                                    title={`Upload file(s) to ${fileUploadPath}`}
                                >
                                    <StyledIconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenAddFile();
                                        }}
                                    >
                                        <FileUploadOutlined fontSize="inherit" />
                                    </StyledIconButton>
                                </Tooltip>
                                <Tooltip
                                    title={`Create new file at ${fileUploadPath}`}
                                >
                                    <StyledIconButton
                                        title={`Create new file at ${fileUploadPath}`}
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenCreateFile('file');
                                        }}
                                    >
                                        <NoteAddOutlined fontSize="inherit" />
                                    </StyledIconButton>
                                </Tooltip>
                                <Tooltip
                                    title={`Create new folder at ${fileUploadPath}`}
                                >
                                    <StyledIconButton
                                        size={'small'}
                                        color={'default'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenCreateFile('directory');
                                        }}
                                    >
                                        <CreateNewFolderOutlined fontSize="inherit" />
                                    </StyledIconButton>
                                </Tooltip>
                            </StyledIconGroup>
                        </StyledIconHeader>
                        <EngineFileExplorer
                            key={counter}
                            type={EXPLORER_TYPE}
                            engine={active.id}
                            onSelect={(path) => {
                                handleOnSelect(path);
                            }}
                            onTrashClick={(e, path) => {
                                handleOnTrashClick(path);
                            }}
                            expandedPaths={expandedPaths}
                            onToggleExpand={handleToggleExpand}
                            onDataLoad={handleDataLoad}
                        />
                    </StyledSidebar>

                    <StyledDiv>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '5px',
                            }}
                        >
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={({ active, over }) => {
                                    if (active.id !== over?.id) {
                                        const oldIndex = fileList.indexOf(
                                            active.id as string,
                                        );
                                        const newIndex = fileList.indexOf(
                                            over?.id as string,
                                        );
                                        const reordered = arrayMove(
                                            fileList,
                                            oldIndex,
                                            newIndex,
                                        );
                                        setFileList(reordered);
                                    }
                                }}
                            >
                                <SortableContext
                                    items={fileList}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <Stack direction="row" spacing={1}>
                                        {fileList.map((filePath) => {
                                            const fileName = filePath
                                                .split('/')
                                                .pop();
                                            const isSelected =
                                                selectedPath === filePath;

                                            return (
                                                <SortableChip
                                                    key={filePath}
                                                    filePath={filePath}
                                                    fileName={fileName}
                                                    isSelected={isSelected}
                                                    onClick={() =>
                                                        setSelectedPath(
                                                            filePath,
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        handleFileClose(
                                                            filePath,
                                                        )
                                                    }
                                                />
                                            );
                                        })}
                                    </Stack>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {selectedPath ? (
                            <EngineFileEditor
                                engineId={active.id}
                                filePath={selectedPath}
                            />
                        ) : (
                            <Typography variant="body2" color="secondary">
                                Select a file to view its contents
                            </Typography>
                        )}
                    </StyledDiv>
                </Stack>
                {showAddFileModal && (
                    <Modal
                        open
                        onClose={() => setShowAddFileModal(false)}
                        fullWidth
                    >
                        <EngineAddFileOverlay
                            type={EXPLORER_TYPE}
                            engine={active.id}
                            onClose={(success, uploadPath) => {
                                if (success) {
                                    createPanel(uploadPath);
                                    refreshFiles();
                                }
                                // close the overlay
                                setShowAddFileModal(false);
                            }}
                            uploadPath={fileUploadPath}
                        />
                    </Modal>
                )}
                {showCreateFileModal && (
                    <Modal
                        open
                        onClose={() => setShowCreateFileModal(false)}
                        fullWidth
                    >
                        <EngineCreateFileOverlay
                            type={EXPLORER_TYPE}
                            engine={active.id}
                            uploadPath={fileUploadPath}
                            mode={createMode}
                            onClose={(success, uploadPath) => {
                                if (success && createMode === 'file') {
                                    createPanel(uploadPath);
                                }

                                refreshFiles();
                                setShowCreateFileModal(false);
                                setFileUploadPath(null);
                            }}
                        />
                    </Modal>
                )}
                {showDeleteModal && (
                    <Modal
                        open={true}
                        onClose={() => setShowDeleteModal(false)}
                        fullWidth
                    >
                        <EngineDeleteFileOverlay
                            type={EXPLORER_TYPE}
                            engine={active.id}
                            fileDeletePath={fileDeletePath}
                            onClose={(success) => {
                                if (success) {
                                    removePanel(fileDeletePath);
                                    refreshFiles();
                                }
                                setShowDeleteModal(false);
                                setFileDeletePath(null);
                            }}
                        />
                    </Modal>
                )}
            </StyledLayout>
        </div>
    );
};
