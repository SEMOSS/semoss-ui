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
import { useBlocks, useDesigner } from '@/hooks';
import {
    ChevronRight,
    ExpandMore,
    Home,
    SearchOutlined,
} from '@mui/icons-material/';

import { getIconForBlock } from '../block-defaults';
import { Block } from '@/stores/state/state.types';

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
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    console.log('queries', state.queries);
    console.log('blocks', state.blocks);

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
     * @returns List of pages
     * TO-DO: Go from active page from wherever we decide to hold this in state
     */
    const pages = useMemo(() => {
        const blocks = Object.entries(state.blocks);
        // Filters out pages that are not children of a page
        return blocks.filter((v) => v[1].widget === 'page' && !v[1].parent);
    }, [designer.rendered]);

    /**
     * @returns Children of the Active Page
     * TO-DO: Go off of Active_Page in depenedency array
     */
    const pageBlocks = useMemo(() => {
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
            </StyledMenuHeader>
            <div>
                {pages.length && (
                    <List>
                        {pages.map((p: [string, Block]) => {
                            return (
                                <StyledListItemButton
                                    key={p[0]}
                                    dense={true}
                                    selected={false}
                                    hovered={true}
                                >
                                    {/* TO-DO: Display link of active page */}
                                    {/* p[1].id */}
                                    <List.ItemText primary={'/'} />
                                    <StyledIcon>
                                        <Home />
                                    </StyledIcon>
                                </StyledListItemButton>
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
                    {pageBlocks.length ? (
                        pageBlocks.map((b: string) => {
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
