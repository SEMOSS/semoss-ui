import { useState, useMemo } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Collapse,
    Divider,
    Icon,
    IconButton,
    List,
    Modal,
    Stack,
    TextField,
    TreeView,
    Typography,
    styled,
} from '@semoss/ui';
import {
    useNavigate,
    useLocation,
    matchPath,
    useResolvedPath,
} from 'react-router-dom';
import { ActionMessages, BlockConfig, BlockJSON } from '@/stores';
import { useBlocks, useDesigner } from '@/hooks';
import {
    Add,
    ChevronRight,
    ExpandMore,
    Home,
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
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const Spacer = styled('div')(() => ({
    flex: 1,
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledSearchedLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'search',
})<{
    /** Track if it is a search term */
    search: boolean;
}>(({ search, theme }) => ({
    color: search ? theme.palette.primary.main : '',
}));

const StyledListItemButton = styled(List.ItemButton, {
    shouldForwardProp: (prop) => prop !== 'hovered',
})<{
    /** Track if the drag is on */
    hovered: boolean;
}>(({ hovered, theme }) => ({
    // outline: hovered ? '1px solid red' : '',
    background: hovered ? theme.palette.action.selected : '',
    '&:hover *[data-hover]': {
        visibility: 'visible',
    },
}));

const StyledIcon = styled(Icon)(() => ({
    color: 'rgba(0, 0, 0, .3)',
}));

const StyledTreeItemLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    padding: theme.spacing(1),
    gap: theme.spacing(1),
}));

const StyledNoLayersContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
}));

/**
 * Render the OutlineMenu
 */
export const OutlineMenu = observer((): JSX.Element => {
    // get the store
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();

    const navigate = useNavigate();
    const location = useLocation();
    const resolvedPath = useResolvedPath('');

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    const [addPageModal, setAddPageModal] = useState<boolean>(false);
    const [newPageRoute, setNewPageRoute] = useState<string>('');

    /**
     * Adds Page in state store
     */
    const addPageBlock = () => {
        // construct page json with route and dispatch to store
        const json: BlockJSON = {
            widget: 'page',
            data: {
                route: newPageRoute,
            },
            slots: {
                content: [],
            },
            // slots: {},
            listeners: {},
        };

        designer.blocks.dispatch({
            message: ActionMessages.ADD_BLOCK,
            payload: {
                json: json,
            },
        });

        setAddPageModal(false);
        setNewPageRoute('');
    };

    /**
     * Check if a path is active
     * @param path - path to check against
     * @returns true if the path is active
     */
    const isActive = (path: string) => {
        return !!matchPath(
            resolvedPath.pathname + '/' + path,
            location.pathname,
        );
    };

    /**
     * Render the block and it's children
     * @param id - id of the block that will be rendered
     * @returns tree of the widgets
     */
    const renderBlock = (id: string) => {
        // get the block
        const block = state.blocks[id];

        // if there is no block, ignore it
        if (!block) {
            return null;
        }

        // get the icon
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
                        <StyledIcon>
                            <WidgetIcon />
                        </StyledIcon>
                        <StyledSearchedLabel
                            search={
                                block.widget
                                    .toLowerCase()
                                    .indexOf(
                                        search
                                            ? search.toLowerCase()
                                            : 'Not a widget',
                                    ) > -1
                            }
                        >
                            {block.widget.charAt(0).toUpperCase() +
                                block.widget.slice(1)}
                        </StyledSearchedLabel>
                    </StyledTreeItemLabel>
                }
                onClick={(e) => {
                    // stop the propogation
                    e.stopPropagation();

                    // select it
                    designer.setSelected(block.id);
                }}
                onMouseOver={(e) => {
                    // stop the propogation
                    e.stopPropagation();

                    // set as hovered
                    designer.setHovered(block.id);
                }}
                onMouseLeave={(e) => {
                    // stop the propogation
                    e.stopPropagation();

                    // clear the hovered state
                    designer.setHovered('');
                }}
            >
                {children.map((c) => {
                    return renderBlock(c);
                })}
            </TreeView.Item>
        );
    };

    // get the pages as an array
    const pages = computed(() => {
        const pages: { route: string; name: string; id: string }[] = [];
        for (const b in state.blocks) {
            const block = state.blocks[b];

            // check if it is a page widget
            if (block.widget === 'page') {
                // store the pages
                pages.push({
                    id: block.id,
                    name: (block.data?.name as string) || '',
                    route: (block.data?.route as string) || '',
                });
            }
        }

        // sort by the path
        return pages.sort((a, b) => {
            const aRoute = a.route.toLowerCase(),
                bRoute = b.route.toLowerCase();

            if (aRoute < bRoute) {
                return -1;
            }
            if (aRoute > bRoute) {
                return 1;
            }
            return 0;
        });
    }).get();

    // get the active page
    const activePage = useMemo(() => {
        // find the active page
        for (const p of pages) {
            if (isActive(p.route)) {
                return p.id;
            }
        }

        return '';
    }, [pages, resolvedPath.pathname, location.pathname]);

    console.log(state.blocks);
    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Typography variant="body1">Pages</Typography>
                <IconButton
                    color="default"
                    size="small"
                    onClick={() => {
                        setAddPageModal(true);
                    }}
                >
                    <Add fontSize="medium" />
                </IconButton>
            </StyledMenuHeader>
            {pages.length ? (
                <List>
                    {pages.map((p) => {
                        return (
                            <StyledListItemButton
                                key={p.id}
                                dense={true}
                                selected={isActive(p.route)}
                                hovered={true}
                                onClick={() => {
                                    // navigate to the page
                                    navigate(p.route);

                                    // select it
                                    designer.setSelected(p.id);
                                }}
                            >
                                <List.ItemText
                                    primary={p.name}
                                    secondary={p.route}
                                />
                                {!p.route && (
                                    <StyledIcon>
                                        <Home />
                                    </StyledIcon>
                                )}
                            </StyledListItemButton>
                        );
                    })}
                </List>
            ) : null}

            <StyledMenuHeader>
                <Typography variant="body1">Layers</Typography>
                <Stack
                    flex={1}
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    justifyContent="end"
                >
                    <Collapse orientation="horizontal" in={showSearch}>
                        <TextField
                            placeholder="Search"
                            size="small"
                            sx={{
                                width: '200px',
                            }}
                            value={search}
                            variant="outlined"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Collapse>
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
                    onNodeToggle={(e, nodeIds: string[]) => {
                        setExpanded(nodeIds);
                    }}
                    onNodeSelect={(e, nodeIds: string[]) => {
                        setSelected(nodeIds);
                    }}
                    defaultCollapseIcon={
                        <StyledIcon>
                            <ExpandMore />
                        </StyledIcon>
                    }
                    defaultExpandIcon={
                        <StyledIcon>
                            <ChevronRight />
                        </StyledIcon>
                    }
                >
                    {activePage ? (
                        renderBlock(activePage)
                    ) : (
                        <StyledNoLayersContainer>
                            No layers
                        </StyledNoLayersContainer>
                    )}
                </TreeView>
            </StyledMenuScroll>
            <Modal open={addPageModal} fullWidth>
                <Modal.Title>Add Page</Modal.Title>
                <Modal.Content>
                    <TextField
                        required
                        fullWidth
                        label="Route"
                        value={newPageRoute}
                        onChange={(e) => setNewPageRoute(e.target.value)}
                    ></TextField>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => {
                            setAddPageModal(false);
                            setNewPageRoute('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            addPageBlock();
                        }}
                    >
                        Add
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledMenu>
    );
});
