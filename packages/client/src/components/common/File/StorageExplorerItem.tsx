import { useCallback, useState } from 'react';
import {
    DeleteOutline,
    FolderOutlined,
    InsertDriveFileOutlined,
    CloudUploadOutlined,
    CloudDownloadOutlined,
    CheckBoxOutlineBlank,
    CheckBox,
} from '@mui/icons-material';
import {
    CircularProgress,
    Icon,
    IconButton,
    styled,
    TreeView,
    Typography,
} from '@semoss/ui';
import { usePixel, useRootStore } from '@/hooks';

const StyledNode = styled(TreeView.Item)(({ theme }) => ({
    '.MuiCollapse-wrapperInner': {
        height: 'auto',
        overflow: 'none',
    },
}));

const StyledLabel = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isDragging',
})<{
    isDragging: boolean;
}>(({ theme, isDragging }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.spacing(3),
    width: '100%',
    gap: theme.spacing(1),
    opacity: isDragging ? 0.5 : 1,
}));

const StyledTypography = styled(Typography)(() => ({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    flex: '1',
}));

const StyledActionContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
}));

interface StorageExplorerItemProps {
    /** Storage engine ID */
    storageId: string;

    /** file details */
    name: string;
    path: string;
    isDirectory: boolean;
    lastModified: string;

    /** node details */
    expanded: string[];
    selected: string[];

    /** Triggered when the Label starts dragging */
    onDragStart?: (
        event: React.DragEvent<HTMLDivElement>,
        path: string,
    ) => void;

    /** Triggered when the item ends dragging */
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
    
    /** Triggered when download multiple is requested */
    onDownloadMultiple?: (paths: string[]) => void;
    
    /** Triggered when item is selected/deselected */
    onSelect?: (path: string, isSelected: boolean) => void;
}

export const StorageExplorerItem = (props: StorageExplorerItemProps) => {
    const {
        storageId,
        path,
        name,
        isDirectory,
        expanded,
        selected,
        onDragStart = () => null,
        onDragEnd = () => null,
        onTrashClick = () => null,
        onUpload = () => null,
        onDownload = () => null,
        onDownloadMultiple = () => null,
        onSelect = () => null,
    } = props;
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { monolithStore } = useRootStore();

    const isOpen = expanded.indexOf(path) > -1;

    // Get storage files for this directory
    const getStorageFiles = usePixel<string[]>(
        isDirectory && isOpen
            ? `Storage(storage = "${storageId}") | ListStoragePath(storagePath='${path}');`
            : '',
    );

    const nodeRef = useCallback((ele) => {
        ele?.addEventListener('focusin', (e) => {
            e.stopImmediatePropagation();
        });
    }, []);

    const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        // For now, use a hardcoded file path - in a real implementation,
        // this would open a file picker dialog
        const localFilePath = "C:/Users/relkhishen/Downloads/file.txt";
        onUpload(path, localFilePath);
    };

    const handleDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onDownload(path);
    };

    // Transform storage files into structured format
    const childFiles = getStorageFiles.status === 'SUCCESS'
        ? getStorageFiles.data.map((filePath) => {
            const pathParts = filePath.split('/').filter(Boolean);
            const fileName = pathParts[pathParts.length - 1] || filePath;
            const isChildDirectory = filePath.endsWith('/');
            
            return {
                name: fileName,
                path: filePath,
                type: isChildDirectory ? 'directory' : 'file',
                lastModified: '',
            };
        })
        : [];

    return (
        <StyledNode
            ref={nodeRef}
            key={path}
            nodeId={path}
            title={name}
            label={
                <StyledLabel
                    draggable={true}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    isDragging={isDragging}
                    onDragStart={(e) => {
                        setIsDragging(true);

                        // trigger the callback
                        onDragStart(e, path);
                    }}
                    onDragEnd={(e) => {
                        setIsDragging(false);

                        // trigger the callback
                        onDragEnd(e, path);
                    }}
                >
                    <Icon
                        color={'disabled'}
                        fontSize="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            const isSelected = selected.includes(path);
                            onSelect(path, !isSelected);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {selected.includes(path) ? (
                            <CheckBox fontSize="inherit" />
                        ) : (
                            <CheckBoxOutlineBlank fontSize="inherit" />
                        )}
                    </Icon>
                    <Icon color={'disabled'} fontSize="small">
                        {isDirectory ? (
                            <FolderOutlined fontSize="inherit" />
                        ) : (
                            <InsertDriveFileOutlined fontSize="inherit" />
                        )}
                    </Icon>
                    <StyledTypography variant="body2">{name}</StyledTypography>
                    {isHovered ? (
                        <StyledActionContainer>
                            {isDirectory && (
                                <IconButton
                                    title={`Upload to ${name}`}
                                    onClick={handleUploadClick}
                                    size="small"
                                    color={'default'}
                                >
                                    <CloudUploadOutlined fontSize="inherit" />
                                </IconButton>
                            )}
                            {!isDirectory && (
                                <IconButton
                                    title={`Download ${name}`}
                                    onClick={handleDownloadClick}
                                    size="small"
                                    color={'default'}
                                >
                                    <CloudDownloadOutlined fontSize="inherit" />
                                </IconButton>
                            )}
                            <IconButton
                                title={`Delete ${name}`}
                                onClick={(e) => {
                                    // don't allow it to propagate
                                    e.stopPropagation();

                                    // trigger
                                    onTrashClick(e, path);
                                }}
                                size="small"
                                color={'default'}
                            >
                                <DeleteOutline fontSize="inherit" />
                            </IconButton>
                        </StyledActionContainer>
                    ) : null}
                </StyledLabel>
            }
        >
            {isDirectory ? (
                <>
                    {getStorageFiles.status === 'INITIAL' ||
                    getStorageFiles.status === 'LOADING' ? (
                        <Icon color="disabled">
                            <CircularProgress color="inherit" size={'small'} />
                        </Icon>
                    ) : null}
                    {getStorageFiles.status === 'SUCCESS'
                        ? childFiles.map((n) => {
                               return (
                                   <StorageExplorerItem
                                       key={n.path}
                                       storageId={storageId}
                                       isDirectory={n.type === 'directory'}
                                       name={n.name}
                                       path={n.path}
                                       lastModified={n.lastModified}
                                       expanded={expanded}
                                       selected={selected}
                                       onTrashClick={(e, path) => {
                                           onTrashClick(e, path);
                                       }}
                                       onDragStart={(e, path) => {
                                           onDragStart(e, path);
                                       }}
                                       onDragEnd={(e, path) => {
                                           onDragEnd(e, path);
                                       }}
                                       onUpload={(storagePath, localPath) => {
                                           onUpload(storagePath, localPath);
                                       }}
                                       onDownload={(path) => {
                                           onDownload(path);
                                       }}
                                       onDownloadMultiple={(paths) => {
                                           onDownloadMultiple(paths);
                                       }}
                                       onSelect={(path, isSelected) => {
                                           onSelect(path, isSelected);
                                       }}
                                   />
                               );
                           })
                        : null}
                </>
            ) : null}
        </StyledNode>
    );
}; 