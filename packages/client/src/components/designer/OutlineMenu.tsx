import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    styled,
    List,
    Typography,
    Divider,
    Icon,
    TreeView,
} from '@semoss/ui';
import { useBlocks, useDesigner } from '@/hooks';
import {
    AutoAwesome,
    ContentCopyOutlined,
    ExpandMore,
    ChevronRight,
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
    CreateNewFolderOutlined,
    NoteAddOutlined,
} from '@mui/icons-material/';

import { getIconForBlock } from '../block-defaults';

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
    justifyContent: 'flex-start',
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

const StyledListItemButton = styled(List.ItemButton, {
    shouldForwardProp: (prop) => prop !== 'hovered',
})<{
    /** Track if the drag is on */
    hovered: boolean;
}>(({ hovered, theme }) => ({
    // outline: hovered ? '1px solid red' : '',
    background: hovered ? theme.palette.action.hover : '',
    '&:hover *[data-hover]': {
        visibility: 'visible',
    },
}));

const StyledListIndent = styled('div')(({ theme }) => ({
    paddingLeft: theme.spacing(2),
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, .3)',
}));

/**
 * Render the OutlineMenu
 */
export const OutlineMenu = observer((): JSX.Element => {
    // get the store
    const { state } = useBlocks();
    const { designer } = useDesigner();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

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
                endIcon={<WidgetIcon />}
                label={
                    block.widget.charAt(0).toUpperCase() + block.widget.slice(1)
                }
            >
                {children.map((c) => {
                    return renderBlock(c);
                })}
            </TreeView.Item>
        );
    };

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Typography variant="body1">Layers</Typography>
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
                    {renderBlock(designer.rendered)}
                </TreeView>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
