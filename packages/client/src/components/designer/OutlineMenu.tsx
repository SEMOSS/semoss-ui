import { computed } from 'mobx';
import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Collapse,
    Divider,
    Icon,
    IconButton,
    List,
    TextField,
    TreeView,
    Typography,
    styled,
} from '@semoss/ui';
import {
    Add,
    ChevronRight,
    ExpandMore,
    SearchOutlined,
} from '@mui/icons-material/';

import { useBlocks, useDesigner, useWorkspace } from '@/hooks';
import {
    PageBlockConfig,
    PageBlockDef,
    getIconForBlock,
} from '@/components/block-defaults';
import { Block } from '@/stores';

import { NewPageOverlay } from './NewPageOverlay';

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
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledCollapseSearch = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
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

const StyledIcon = styled(Icon)(({ theme }) => ({
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
    const { state } = useBlocks();
    const { designer } = useDesigner();
    const { workspace } = useWorkspace();

    const navigate = useNavigate();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
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

        const WidgetIcon = getIconForBlock(block.widget);

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
            >
                {children.map((c) => {
                    return renderBlock(c);
                })}
            </TreeView.Item>
        );
    };

    /**
     * Open an overlay to create a new page
     */
    const newPage = () => {
        workspace.openOverlay(() => {
            return <NewPageOverlay onClose={() => workspace.closeOverlay()} />;
        });
    };

    // get the pages as an array
    const pages = computed(() => {
        const pages: Block<PageBlockDef>[] = [];
        for (const b in state.blocks) {
            const block = state.blocks[b];

            // check if it is a page widget
            if (block.widget === PageBlockConfig.widget) {
                // store the pages
                pages.push(block as Block<PageBlockDef>);
            }
        }

        // sort by the path
        return pages.sort((a, b) => {
            const aRoute = a.data.route.toLowerCase(),
                bRoute = b.data.route.toLowerCase();

            if (aRoute < bRoute) {
                return -1;
            }
            if (aRoute > bRoute) {
                return 1;
            }
            return 0;
        });
    }).get();

    /**
     * @returns Children of the Active Page
     * TO-DO: Go off of Active_Page in depenedency array
     */
    const layerBlocks = useMemo(() => {
        const renderedPage = state.blocks[designer.rendered];
        const children = [];
        if (renderedPage) {
            for (const s in renderedPage.slots) {
                children.push(...renderedPage.slots[s].children);
            }
        }

        return children;
    }, [designer.rendered, search]);

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Typography variant="body1">Pages</Typography>
                <IconButton size={'small'} onClick={() => newPage()}>
                    <Add />
                </IconButton>
            </StyledMenuHeader>
            <div>
                {pages.length && (
                    <List>
                        {pages.map((p) => {
                            return (
                                <List.Item key={p.id} dense={true}>
                                    <List.ItemButton
                                        selected={true}
                                        onClick={() =>
                                            navigate(`${p.data.route}`)
                                        }
                                    >
                                        <List.ItemText
                                            primary={
                                                <Typography variant="subtitle2">
                                                    {p.id}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="caption"
                                                    noWrap={true}
                                                >
                                                    {p.data.route}
                                                </Typography>
                                            }
                                        />
                                    </List.ItemButton>
                                </List.Item>
                            );
                        })}
                    </List>
                )}
            </div>

            <StyledMenuHeader>
                <Typography variant="body1">Layers</Typography>
                <StyledCollapseSearch>
                    <Collapse orientation="horizontal" in={showSearch}>
                        <TextField
                            placeholder="Search"
                            size="small"
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
                        <SearchOutlined fontSize="medium" />
                    </IconButton>
                </StyledCollapseSearch>
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
                    {layerBlocks.length ? (
                        layerBlocks.map((b: string) => {
                            return renderBlock(b);
                        })
                    ) : (
                        <StyledNoLayersContainer>
                            No layers to display...
                        </StyledNoLayersContainer>
                    )}
                </TreeView>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
