import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Actions, DockLocation, TabNode } from 'flexlayout-react';
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
import { useBlocks, useDesigner, useWorkspace } from '@/hooks';
import {
    Add,
    ChevronRight,
    ContentCopy,
    ExpandMore,
    LibraryAdd,
    Search,
    SearchOff,
    Home,
    Delete,
} from '@mui/icons-material/';
import { INPUT_BLOCK_TYPES, ActionMessages } from '@/stores';
import { AddVariableModal } from '@/components/notebook';
import { Panel } from '@/components/workspace';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    maxHeight: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
}));

const StyledMenuHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: theme.spacing(5),
    width: '100%',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
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

const StyledPageItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'search',
})<{
    /** Track if it is a search term */
    search: boolean;
    isselected: string;
}>(({ isselected, search, theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    height: 'auto',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1) + ' ' + theme.spacing(2),
    color: search ? theme.palette.primary.main : '',
    backgroundColor: isselected == 'true' ? 'rgba(25, 118, 210, 0.2)' : '',
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
        route: '',
    },
    listeners: {
        onPageLoad: [],
    },
    slots: {
        content: [],
    },
};

/**
 * Render the Layers
 */
export const LayersPanel = observer((): JSX.Element => {
    // get the store
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();
    const { workspace } = useWorkspace();
    const [expanded, setExpanded] = useState<string[]>([]);
    const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
    const [selectedPages, setSelectedPages] = useState<string>('page-1');
    const [selectedLayer, setSelectedLayer] = useState([]);
    const [pageHovered, setPageHovered] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    const [variableModal, setVariableModal] = useState('');
    // const [allPages, setAllPage] = useState(state.getAllBlocksOfType('page'));
    const allPages = state.getAllBlocksOfType('page');

    useEffect(() => {
        const parents = state.getAllParents(designer.selected);
        if (parents.length) {
            const parentPage = parents.find((parent) =>
                parent.includes('page'),
            );
            selectLayer(parentPage);
            setSelectedPages(parentPage);
        }
        setExpanded(parents);
    }, [designer.selected]);

    useEffect(() => {
        const block = state.blocks[selectedPages];
        handlePageSelection(block);
    }, []);

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
        const variableName = state.getAlias(id);
        const canVariabilize = INPUT_BLOCK_TYPES.indexOf(block.widget) > -1;

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
                    handleOnSelect(block);
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

    const renderPage = (id: string) => {
        const block = state.blocks[id];
        return (
            <StyledPageItem
                key={block.id}
                onClick={(e) => {
                    handlePageSelection(block);
                }}
                isselected={(selectedPages === block.id).toString()}
                search={
                    search
                        ? [block.widget, block.id]
                              .join('')
                              .toLowerCase()
                              .indexOf(search.toLowerCase()) > -1
                        : false
                }
                onMouseOver={(e) => setPageHovered(block.id)}
                onMouseLeave={(e) => setPageHovered('')}
            >
                <Typography variant="subtitle1">/{id}</Typography>
                {id == 'page-1' ? (
                    <StyledTreeItemIcon>
                        <Home />
                    </StyledTreeItemIcon>
                ) : pageHovered === block.id ? (
                    <StyledTreeItemIcon>
                        <Delete
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePageDeletion(block);
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    </StyledTreeItemIcon>
                ) : (
                    <></>
                )}
            </StyledPageItem>
        );
    };

    const handlePageSelection = (block) => {
        selectLayer(block.id);
        designer.setSelected(block.id);
        handleOnSelect(block);
        setSelectedPages(block.id);
    };

    /*
     * Handle the page deletion
     */
    const handlePageDeletion = (block) => {
        state.dispatch({
            message: ActionMessages.REMOVE_BLOCK,
            payload: {
                id: block.id,
                keep: false,
            },
        });
        if (designer.selected === block.id) {
            designer.setSelected('');
        }
        removePanel(block.id);
    };
    /** Helpers */
    /**
     * Create a new panel and highlight it
     *
     * id - id of the notebook
     */
    const createPanel = (id: string): boolean => {
        try {
            if (!id) {
                return false;
            }

            // get the model
            const model = workspace.selectedLayout?.model;
            if (!model) {
                throw new Error('Missing model');
            }

            // get the name
            const name = id;

            // where to add the node
            const addId =
                model.getActiveTabset()?.getId() ||
                model.getRoot().getChildren()[0]?.getId() ||
                '';

            // create and select the panel
            model.doAction(
                Actions.addNode(
                    {
                        type: 'tab',
                        name: name,
                        component: 'designer',
                        config: {
                            id: id,
                        },
                        enableClose: true,
                    },
                    addId,
                    DockLocation.CENTER,
                    -1,
                    true,
                ),
            );
            // designer.setRendered(id);
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
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

    const selectLayer = (id: string) => {
        const selectedPage = allPages.find((page) => page.id === id);
        if (!selectedPage) return;
        const children = [];
        for (const s in selectedPage.slots) {
            children.push(...selectedPage.slots[s].children);
        }
        setSelectedLayer(children);
    };

    /**
     * Select a panel and create one if it doesn't exist
     *
     * id - id of the layer
     */
    const handleOnSelect = (blockData) => {
        if (blockData.widget !== 'page') return;
        const id = blockData.id;
        // try to select a panel, if it doesn't exist create it. Save the path
        const IsSelected = selectPanel(id);
        if (!IsSelected) {
            createPanel(id);
        }
        // set the path
        if (blockData.widget !== 'page') {
            setSelectedLayers([id]);
        } else {
            setSelectedPages(id);
        }
        // designer.setRendered(id);
    };

    /**
     * Select a panel if it is there. Return false if not selected.
     *
     * id - id of the layer
     */
    const selectPanel = (id: string): boolean => {
        try {
            if (!id) {
                return false;
            }

            let selectedNode: TabNode | null = null;

            // get the model
            const model = workspace.selectedLayout?.model;
            if (!model) {
                throw new Error('Missing model');
            }

            selectedNode = getNodeInfo(id, model);

            // create a new panel if there is no node
            if (!selectedNode) {
                return false;
            }

            const selectedNodeId = selectedNode.getId();
            model.doAction(Actions.selectTab(selectedNodeId));
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    const getNodeInfo = (id, model) => {
        let returnedNode: TabNode | null = null;
        // visit the notes, and see if it exists
        model.visitNodes((node) => {
            // check if it is a tabNode
            if (node instanceof TabNode) {
                // it needs to be a notebook-viewer
                const component = node.getComponent();
                if (component !== 'designer') {
                    return;
                }

                // path and space need to match
                const config = node.getConfig();
                if (config.id !== id) {
                    return;
                }

                returnedNode = node;
            }
        });

        return returnedNode;
    };

    /**
     * Remove a panel if it is there. Return false if not selected.
     *
     * id - id of the layer
     */
    const removePanel = (id: string): boolean => {
        try {
            if (!id) {
                return false;
            }

            let selectedNode: TabNode | null = null;

            // get the model
            const model = workspace.selectedLayout?.model;
            if (!model) {
                throw new Error('Missing model');
            }

            selectedNode = getNodeInfo(id, model);

            // create a new panel if there is no node
            if (!selectedNode) {
                return false;
            }

            const selectedNodeId = selectedNode.getId();
            model.doAction(Actions.deleteTab(selectedNodeId));
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    /**
     * handle the add page
     */
    const handlePageAdd = () => {
        state.dispatch({
            message: ActionMessages.ADD_BLOCK,
            payload: {
                json: PAGE_BLOCK,
            },
        });
    };

    return (
        <Panel>
            <StyledMenu>
                <StyledMenuHeader>
                    <Stack spacing={2} paddingBottom={1} width={'100%'}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems={'center'}
                        >
                            <Typography variant="h6">Pages</Typography>
                            <IconButton
                                className="layers-menu__add-layer-button"
                                onClick={(e) => {
                                    handlePageAdd();
                                }}
                            >
                                <Add />
                            </IconButton>
                        </Stack>
                    </Stack>
                </StyledMenuHeader>
                <StyledMenuScroll>
                    {allPages?.length ? (
                        allPages.map((page) => renderPage(page.id))
                    ) : (
                        <StyledTreeItemMessage>
                            <Typography variant="caption">No Pages</Typography>
                        </StyledTreeItemMessage>
                    )}
                </StyledMenuScroll>
            </StyledMenu>
            <Divider />
            <StyledMenu>
                <StyledMenuHeader>
                    <Stack spacing={2} paddingBottom={1} width={'100%'}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems={'center'}
                        >
                            <Typography variant="h6">Layers</Typography>
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
                                style={{ padding: '0px' }}
                            >
                                {showSearch ? (
                                    <SearchOff fontSize="medium" />
                                ) : (
                                    <Search fontSize="medium" />
                                )}
                            </IconButton>
                        </Stack>
                    </Stack>
                </StyledMenuHeader>

                <StyledMenuScroll>
                    <TreeView
                        expanded={expanded}
                        selected={selectedLayers}
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
                            setSelectedLayers(nodeIds);
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
                        {selectedLayer?.length ? (
                            selectedLayer.map((c) => renderBlock(c))
                        ) : (
                            <StyledTreeItemMessage>
                                <Typography variant="caption">
                                    No Layers
                                </Typography>
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
            </StyledMenu>
        </Panel>
    );
});
