import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
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
    LibraryAdd,
    Search,
    SearchOff,
    Add,
} from '@mui/icons-material/';
import { INPUT_BLOCK_TYPES } from '@/stores';
import { AddVariableModal } from '../notebook/AddVariableModal';
import { ActionMessages } from '../../stores/state/state.actions';

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

const PAGE_BLOCK = {
    widget: 'page',
    data: {
        style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '8px',
            fontFamily: 'roboto',
        },
    },
    listeners: {
        onPageLoad: [],
    },
    slots: {
        content: [],
    },
};

export interface LayersMenuProps {
    /**callback function to set the active page */
    renderedPageCallback: Function;
}

/**
 * Render the LayersMenu
 */
export const LayersMenu = observer((props: LayersMenuProps) => {
    // get the store
    const { renderedPageCallback } = props;
    const { registry, state } = useBlocks();

    const { designer } = useDesigner();
    const notification = useNotification();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    const [variableModal, setVariableModal] = useState('');

    const allBlockKeys = Object.keys(state.blocks);
    const allPages = [];
    allBlockKeys.forEach((key) => {
        console.log(state.blocks[key].widget);
        if (state.blocks[key].widget == 'page') {
            allPages.push(state.blocks[key]);
        }
    });

    /**
     * Render the block and it's children
     * @param id - id of the block to render
     * @returns tree of the widgets
     */
    const renderBlock = (id: string) => {
        // get the block
        const block = state.blocks[id];
        const variableName = state.getAlias(id);
        const canVariabilize = INPUT_BLOCK_TYPES.indexOf(block.widget) > -1;

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
                                {block.data.pageName
                                    ? block.data.pageName
                                    : block.widget.charAt(0).toUpperCase() +
                                      block.widget.slice(1)}
                            </StyledLabelTitle>
                            <StyledLabelSubtitleText>
                                {variableName ? variableName : block.id}
                            </StyledLabelSubtitleText>
                        </StyledLabelContainer>
                        {variableName ? (
                            <StyledTreeItemIconButton
                                aria-label="copy"
                                title={`Copy variable`}
                                color="default"
                                size="small"
                                onClick={(e: React.SyntheticEvent) => {
                                    e.stopPropagation();
                                    copy(`{{${variableName}}}`);
                                }}
                                data-onhover
                            >
                                <ContentCopy fontSize="small" />
                            </StyledTreeItemIconButton>
                        ) : canVariabilize ? (
                            <StyledTreeItemIconButton
                                aria-label="add"
                                title={`Add variable`}
                                size="small"
                                color={'primary'}
                                onClick={(e: React.SyntheticEvent) => {
                                    e.stopPropagation();
                                    setVariableModal(block.id);
                                }}
                                data-onhover
                            >
                                <LibraryAdd fontSize="small" />
                            </StyledTreeItemIconButton>
                        ) : null}
                    </StyledTreeItemLabel>
                }
                onClick={(e: React.SyntheticEvent) => {
                    e.stopPropagation();
                    designer.setSelected(block.id);
                    if (block.widget == 'page') {
                        renderedPageCallback(block.id);
                    }
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

    const handlePageAdd = () => {
        state.dispatch({
            message: ActionMessages.ADD_BLOCK,
            payload: {
                json: PAGE_BLOCK,
            },
        });
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
                    {!!allPages?.length ? (
                        allPages.map((page) => renderBlock(page.id))
                    ) : (
                        <StyledTreeItemMessage>
                            <Typography variant="caption">No Layers</Typography>
                        </StyledTreeItemMessage>
                    )}
                </TreeView>
            </StyledMenuScroll>
            {variableModal ? (
                <AddVariableModal
                    open={true}
                    to={variableModal}
                    type={'block'}
                    onClose={() => setVariableModal('')}
                />
            ) : null}
            <IconButton
                color="default"
                size="small"
                onClick={() => {
                    handlePageAdd();
                }}
            >
                <Add fontSize="medium" />
                Add Page
            </IconButton>
        </StyledMenu>
    );
});
