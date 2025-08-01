import { useCallback, useState } from 'react';
import {
    DeleteOutline,
    DescriptionOutlined,
    TopicOutlined,
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

const StyledNode = styled(TreeView.Item)({
    '.MuiCollapse-wrapperInner': {
        height: 'auto',
        overflow: 'none',
    },
});

const StyledLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.spacing(3),
    width: '100%',
    gap: theme.spacing(1),
}));

const StyledTypography = styled(Typography)(() => ({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    flex: '1',
}));

const StyledIconWrapper = styled(Icon)({
  color: 'inherit',
  '& svg': {
    color: '#9E9E9E',
    width: 20,
    height: 20,
  },
});

interface EngineFileExplorerItemProps {
    type: 'engine';
    engine: string;
    /** file details */
    name: string;
    path: string;
    isDirectory: boolean;
    lastModified: string;

    /** node details */
    expanded: string[];
    selected: string[];

    onTrashClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => void;
}

export const EngineFileExplorerItem = (props: EngineFileExplorerItemProps) => {
    const {
        type,
        engine,
        path,
        name,
        isDirectory,
        expanded,
        selected,
        onTrashClick = () => null,
    } = props;
    const [isHovered, setIsHovered] = useState(false);

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
            ? type === 'engine'
                ? `BrowseEngineAssets(filePath=["${path}"], engine=["${engine}"]);`
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
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <StyledIconWrapper color='disabled' fontSize='small'>
                        {isDirectory ? <TopicOutlined /> : <DescriptionOutlined />}
                    </StyledIconWrapper>
                    <StyledTypography variant="body2">{name}</StyledTypography>
                    {isHovered ? (
                        <IconButton
                            title={`Delete ${name}`}
                            onClick={(e) => {
                                // don't allow it to propagate
                                e.stopPropagation();
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
                                  <EngineFileExplorerItem
                                      key={n.path}
                                      type={type}
                                      engine={engine}
                                      isDirectory={n.type === 'directory'}
                                      name={n.name}
                                      path={n.path}
                                      lastModified={n.lastModified}
                                      expanded={expanded}
                                      selected={selected}
                                      onTrashClick={(e, path) => {
                                          onTrashClick(e, path);
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
