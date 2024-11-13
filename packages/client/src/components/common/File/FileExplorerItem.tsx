import { useCallback, useState } from 'react';
import {
    DeleteOutline,
    FolderOutlined,
    InsertDriveFileOutlined,
} from '@mui/icons-material';
import {
    CircularProgress,
    Icon,
    IconButton,
    styled,
    TreeView,
    Typography,
} from '@semoss/ui';
import { usePixel } from '@/hooks';

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

interface FileExplorerItemProps {
    /** Type of file opened */
    type: 'app' | 'insight';

    /** Space where the file is located */
    space: string;

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
}

export const FileExplorerItem = (props: FileExplorerItemProps) => {
    const {
        type,
        space,
        path,
        name,
        isDirectory,
        expanded,
        selected,
        onDragStart = () => null,
        onDragEnd = () => null,
        onTrashClick = () => null,
    } = props;
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const isOpen = expanded.indexOf(path) > -1;

    const getAssets = usePixel<
        {
            lastModified: string;
            name: string;
            path: string;
            type: 'directory' | 'file';
        }[]
    >(
        isDirectory && isOpen
            ? type === 'app'
                ? `BrowseAsset(filePath=["${path}"], space=["${space}"]);`
                : ''
            : '',
    );

    const nodeRef = useCallback((ele) => {
        ele?.addEventListener('focusin', (e) => {
            e.stopImmediatePropagation();
        });
    }, []);

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
                    <Icon color={'disabled'} fontSize="small">
                        {isDirectory ? (
                            <FolderOutlined fontSize="inherit" />
                        ) : (
                            <InsertDriveFileOutlined fontSize="inherit" />
                        )}
                    </Icon>
                    <StyledTypography variant="body2">{name}</StyledTypography>
                    {isHovered ? (
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
                    ) : null}
                </StyledLabel>
            }
        >
            {isDirectory ? (
                <>
                    {getAssets.status === 'INITIAL' ||
                    getAssets.status === 'LOADING' ? (
                        <Icon color="disabled">
                            <CircularProgress color="inherit" size={'small'} />
                        </Icon>
                    ) : null}
                    {getAssets.status === 'SUCCESS'
                        ? getAssets.data.map((n) => {
                              return (
                                  <FileExplorerItem
                                      key={n.path}
                                      type={type}
                                      space={space}
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
                                  />
                              );
                          })
                        : null}
                </>
            ) : null}
        </StyledNode>
    );
};
