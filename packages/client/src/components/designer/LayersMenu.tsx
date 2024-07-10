import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Divider,
    Icon,
    IconButton,
    Stack,
    TextField,
    TreeView,
    Typography,
    styled,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useDesigner } from '@/hooks';
import {
    ChevronRight,
    ContentCopy,
    ExpandMore,
    Search,
    SearchOff,
} from '@mui/icons-material/';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
}));

const StyledMenuHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    lineHeight: theme.spacing(5),
    width: '100%',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledLabelContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'search',
})<{
    /** Track if it is a search term */
    search: boolean;
}>(({ search, theme }) => ({
    flex: 1,
    color: search ? theme.palette.primary.main : '',
    overflow: 'hidden',
}));

const StyledLabelTitle = styled('div')(({ theme }) => ({
    ...theme.typography.body2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}));

const StyledLabelSubtitleText = styled('div')(({ theme }) => ({
    ...theme.typography.caption,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}));

const StyledTreeItemIcon = styled(Icon)(() => ({
    color: 'rgba(0, 0, 0, .3)',
}));

const StyledTreeItemIconButton = styled(IconButton)(() => ({
    '&[data-onhover]': {
        display: 'none',
    },
}));

const StyledTreeItemLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1),
    gap: theme.spacing(1),
    '&:hover [data-onhover]': {
        display: 'block',
    },
}));

const StyledTreeItemMessage = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
}));

/**
 * Render the LayersMenu
 */
export const LayersMenu = observer((): JSX.Element => {
    // get the store
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // get the active page
    const activePage = state.blocks[designer.rendered];

    /**
     * Render the block and it's children
     * @param id - id of the block to render
     * @returns tree of the widgets
     */
    const renderBlock = (id: string) => {
        // get the block
        const block = state.blocks[id];

        // render each of hte c
        if (!block) {
            return null;
        }

        const WidgetIcon = registry[block.widget].icon;

        const children = [];
        for (const s in block.slots) {
            children.push(...block.slots[s].children);
        }

        return (
            <TreeView.Item
                key={block.id}
                nodeId={block.id}
                label={
                    <StyledTreeItemLabel>
                        <StyledTreeItemIcon>
                            <WidgetIcon />
                        </StyledTreeItemIcon>
                        <StyledLabelContainer
                            search={
                                search
                                    ? [block.widget, block.id]
                                          .join('')
                                          .toLowerCase()
                                          .indexOf(search.toLowerCase()) > -1
                                    : false
                            }
                        >
                            <StyledLabelTitle>
                                {block.widget.charAt(0).toUpperCase() +
                                    block.widget.slice(1)}
                            </StyledLabelTitle>
                            <StyledLabelSubtitleText>
                                {block.id}
                            </StyledLabelSubtitleText>
                        </StyledLabelContainer>
                        <StyledTreeItemIconButton
                            aria-label="copy"
                            title={`Copy ID`}
                            color="default"
                            size="small"
                            onClick={(e: React.SyntheticEvent) => {
                                e.stopPropagation();
                                copy(block.id);
                            }}
                            data-onhover
                        >
                            <ContentCopy fontSize="small" />
                        </StyledTreeItemIconButton>
                    </StyledTreeItemLabel>
                }
                onClick={(e: React.SyntheticEvent) => {
                    e.stopPropagation();
                    designer.setSelected(block.id);
                }}
                onMouseOver={(e: React.SyntheticEvent) => {
                    e.stopPropagation();
                    designer.setHovered(block.id);
                }}
                onMouseLeave={(e: React.SyntheticEvent) => {
                    e.stopPropagation();
                    designer.setHovered('');
                }}
                sx={{
                    minWidth: 0,
                }}
            >
                {children.map((c) => {
                    return renderBlock(c);
                })}
            </TreeView.Item>
        );
    };

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied ID',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy ID',
            });
        }
    };

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Typography variant="h6">Layers</Typography>
                <Stack
                    flex={1}
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    justifyContent="end"
                >
                    {showSearch ? (
                        <TextField
                            placeholder="Search"
                            size="small"
                            sx={{
                                width: '100%',
                                maxWidth: '200px',
                            }}
                            value={search}
                            variant="outlined"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    ) : (
                        <>&nbsp;</>
                    )}
                    <IconButton
                        color="default"
                        size="small"
                        onClick={() => {
                            setShowSearch(!showSearch);
                            setSearch('');
                        }}
                    >
                        {showSearch ? (
                            <SearchOff fontSize="medium" />
                        ) : (
                            <Search fontSize="medium" />
                        )}
                    </IconButton>
                </Stack>
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                <TreeView
                    multiSelect
                    expanded={expanded}
                    selected={selected}
                    onNodeToggle={(
                        e: React.SyntheticEvent,
                        nodeIds: string[],
                    ) => {
                        setExpanded(nodeIds);
                    }}
                    onNodeSelect={(
                        e: React.SyntheticEvent,
                        nodeIds: string[],
                    ) => {
                        setSelected(nodeIds);
                    }}
                    defaultCollapseIcon={
                        <StyledTreeItemIcon>
                            <ExpandMore />
                        </StyledTreeItemIcon>
                    }
                    defaultExpandIcon={
                        <StyledTreeItemIcon>
                            <ChevronRight />
                        </StyledTreeItemIcon>
                    }
                >
                    {activePage ? (
                        renderBlock(activePage.id)
                    ) : (
                        <StyledTreeItemMessage>
                            <Typography variant="caption">No Layers</Typography>
                        </StyledTreeItemMessage>
                    )}
                </TreeView>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
