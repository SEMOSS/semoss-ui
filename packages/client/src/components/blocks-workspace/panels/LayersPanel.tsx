import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Actions, DockLocation, TabNode } from 'flexlayout-react';
import { CSS } from '@dnd-kit/utilities';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import {
    DndContext,
    useDraggable,
    useDroppable,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    UniqueIdentifier,
    DragStartEvent,
    closestCenter,
} from '@dnd-kit/core';
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

import { useBlocks, INPUT_BLOCK_TYPES, ActionMessages } from '@semoss/renderer';
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

import { AddVariableModal } from '@/components/notebook';
import { useDesigner, useWorkspace } from '@/hooks';
import { Panel } from '@/components/workspace';

const customCollisionDetection = (args) => {
    const collisions = closestCenter(args);
    // Filter out collisions that are the same as the active item
    return collisions.filter((collision) => collision.id !== args.active.id);
};

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
    transition: 'background-color 0.2s',
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

type TreeNode = {
    id: string;
    widget: string;
    slots: Record<string, { children: string[] }>;
    children: TreeNode[];
};

const findNode = (
    root: any,
    id: UniqueIdentifier,
): { node: TreeNode; parent: TreeNode | null; slot: string | null } | null => {
    const stack: {
        node: TreeNode;
        parent: TreeNode | null;
        slot: string | null;
    }[] = [{ node: root, parent: null, slot: null }];

    while (stack.length) {
        const { node, parent, slot } = stack.pop()!;
        if (node.id === id) return { node, parent, slot };

        for (const currentSlot of Object.keys(node.slots)) {
            for (const childId of node.slots[currentSlot].children) {
                const childNode = {
                    id: childId,
                    widget: '',
                    slots: {},
                    children: [],
                };
                stack.push({
                    node: childNode,
                    parent: node,
                    slot: currentSlot,
                });
            }
        }
    }
    return null;
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
    const [globalDropPositions, setGlobalDropPositions] = useState<
        'top' | 'bottom' | 'inside' | null
    >(null);

    const [activeNode, setActiveNode] = useState<TreeNode | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
    );

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

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const block = state.blocks[selectedPages];
        const found = findNode(block, active.id);
        setActiveNode(found?.node || null);
    };

    const handleDragEnd = (event) => {
        // Capture the current drop position immediately
        const currentDropPosition = globalDropPositions;

        const { active, over } = event;

        if (!active || !over) {
            return;
        }

        if (active.id === over.id) {
            console.log('Dropped on itself, ignoring.');
            return;
        }

        const activeBlock = state.getBlock(active.id);
        const overBlock = state.getBlock(over.id);

        if (!activeBlock || !overBlock) {
            return;
        }

        // Check if dropping on non container element
        if (
            currentDropPosition === 'inside' &&
            (!overBlock.slots || Object.keys(overBlock.slots).length === 0)
        ) {
            return;
        }

        const getSlotForParent = (parentId) => {
            return parentId === selectedPages ? 'content' : 'children';
        };

        // Check if this is a case of dragging out of a container
        if (
            currentDropPosition === 'bottom' &&
            overBlock.slots &&
            Object.keys(overBlock.slots).length > 0
        ) {
            // This is dragging to bottom of a container - should place it after the container
            // at the parent level

            state.dispatch({
                message: ActionMessages.MOVE_BLOCK,
                payload: {
                    id: active.id,
                    position: {
                        parent: overBlock.parent?.id || selectedPages,
                        sibling: over.id,
                        slot: getSlotForParent(
                            overBlock.parent?.id || selectedPages,
                        ),
                        type: 'after',
                    },
                },
            });
        } else if (currentDropPosition === 'inside' && overBlock.slots) {
            // Moving inside a container

            state.dispatch({
                message: ActionMessages.MOVE_BLOCK,
                payload: {
                    id: active.id,
                    position: {
                        parent: over.id,
                        slot: 'children',
                    },
                },
            });
        } else {
            // Default movement logic based on currentDropPosition
            if (overBlock.parent) {
                state.dispatch({
                    message: ActionMessages.MOVE_BLOCK,
                    payload: {
                        id: active.id,
                        position: {
                            parent: overBlock.parent.id,
                            slot: getSlotForParent(overBlock.parent.id),
                            sibling: over.id,
                            type:
                                currentDropPosition === 'top'
                                    ? 'before'
                                    : 'after',
                        },
                    },
                });
            } else {
                // Fallback if no parent - move to page directly
                state.dispatch({
                    message: ActionMessages.MOVE_BLOCK,
                    payload: {
                        id: active.id,
                        position: {
                            parent: selectedPages,
                            slot: 'content',
                        },
                    },
                });
            }
        }

        setGlobalDropPositions(null);
        selectLayer(selectedPages);
    };

    const DraggableTreeItem = ({
        node,
        children,
    }: {
        node: any;
        children: any;
    }) => {
        const { attributes, listeners, setNodeRef, transform } = useDraggable({
            id: node.id,
        });

        const style = {
            transform: CSS.Translate.toString(transform),
        };

        return (
            <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
                {children}
            </div>
        );
    };

    const DroppableTreeItem = ({
        node,
        children,
        onDropPositionChange,
    }: {
        node: any;
        children: any;
        onDropPositionChange: (position: 'top' | 'bottom' | 'inside') => void;
    }) => {
        const { setNodeRef, isOver, active, over } = useDroppable({
            id: node.id,
        });

        const overBlock = state.getBlock(over?.id as string);

        const isContainer =
            overBlock &&
            overBlock.slots &&
            Object.keys(overBlock.slots).length > 0;
        const [dropPosition, setDropPosition] = useState<
            'top' | 'bottom' | 'inside'
        >('inside');

        const handleMouseMove = (e: React.MouseEvent) => {
            if (!isOver || !active) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            const height = rect.height;

            const topThreshold = Math.min(height * 0.25, 15); // 25% from top or 15px, whichever is smaller
            const bottomThreshold = isContainer
                ? height * 0.7
                : height - topThreshold;

            let newDropPosition: 'top' | 'bottom' | 'inside';

            if (mouseY < topThreshold) {
                newDropPosition = 'top';
            } else if (mouseY > bottomThreshold) {
                newDropPosition = 'bottom';
            } else {
                newDropPosition = 'inside';
            }
            setGlobalDropPositions(newDropPosition);

            if (dropPosition !== newDropPosition) {
                setDropPosition(newDropPosition);
            }
        };

        return (
            <div
                ref={setNodeRef}
                data-id={node.id}
                style={{ position: 'relative' }}
                onMouseMove={handleMouseMove}
            >
                {isOver && (
                    <>
                        {/* Top drop zone */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background:
                                    dropPosition === 'top'
                                        ? '#1976D2'
                                        : 'transparent',
                                zIndex: 10,
                            }}
                        />

                        {/* Inside drop zone - only visible when hovering in middle area */}
                        {isContainer && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    left: '4px',
                                    right: '4px',
                                    bottom: '4px',
                                    border:
                                        dropPosition === 'inside'
                                            ? '2px dashed #E91E63'
                                            : 'none',
                                    background:
                                        dropPosition === 'inside'
                                            ? 'rgba(233, 30, 99, 0.1)'
                                            : 'transparent',
                                    zIndex: 9,
                                }}
                            />
                        )}

                        {/* Bottom drop zone */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: isContainer ? '8px' : '4px',
                                background:
                                    dropPosition === 'bottom'
                                        ? '#1976D2'
                                        : 'transparent',
                                zIndex: 10,
                            }}
                        />
                    </>
                )}
                {children}
            </div>
        );
    };

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
            <>
                <DroppableTreeItem
                    node={block}
                    key={block.id}
                    onDropPositionChange={setGlobalDropPositions}
                >
                    <DraggableTreeItem key={block.id} node={block}>
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
                                                      .indexOf(
                                                          search.toLowerCase(),
                                                      ) > -1
                                                : false
                                        }
                                    >
                                        <StyledLabelTitle>
                                            {block.widget
                                                .charAt(0)
                                                .toUpperCase() +
                                                block.widget.slice(1)}
                                        </StyledLabelTitle>
                                        <StyledLabelSubtitleText>
                                            {variableName
                                                ? variableName
                                                : block.id}
                                        </StyledLabelSubtitleText>
                                    </StyledLabelContainer>
                                    {variableName ? (
                                        <StyledTreeItemIconButton
                                            aria-label="copy"
                                            title={`Copy variable`}
                                            color="default"
                                            size="small"
                                            onClick={(
                                                e: React.SyntheticEvent,
                                            ) => {
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
                                            onClick={(
                                                e: React.SyntheticEvent,
                                            ) => {
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
                    </DraggableTreeItem>
                </DroppableTreeItem>
            </>
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
    const handlePageAdd = async () => {
        const newPageId = await state.dispatch({
            message: ActionMessages.ADD_BLOCK,
            payload: {
                json: PAGE_BLOCK,
            },
        });

        if (typeof newPageId === 'string') {
            console.log('newPageId', newPageId);
            const block = state.blocks[newPageId];
            handlePageSelection(block);
        } else {
            console.error('Invalid newPageId:', newPageId);
        }
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
            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToFirstScrollableAncestor]}
            >
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
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
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
            </DndContext>
        </Panel>
    );
});
