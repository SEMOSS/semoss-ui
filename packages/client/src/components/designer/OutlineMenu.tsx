import React from 'react';
import { observer } from 'mobx-react-lite';
import { styled, List, Typography, Divider } from '@semoss/ui';
import { useBlocks, useDesigner } from '@/hooks';

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

/**
 * Render the OutlineMenu
 */
export const OutlineMenu = observer((): JSX.Element => {
    // get the store
    const { state } = useBlocks();
    const { designer } = useDesigner();

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
            return <></>;
        }

        const children = [];
        for (const s in block.slots) {
            children.push(...block.slots[s].children);
        }

        return (
            <React.Fragment key={id}>
                <StyledListItemButton
                    dense={true}
                    selected={block.id === designer.selected}
                    hovered={block.id === designer.hovered}
                    onClick={(event) => {
                        event.stopPropagation();
                        designer.setSelected(block.id);
                    }}
                    onMouseOver={() => {
                        designer.setHovered(block.id);
                    }}
                    onMouseLeave={() => {
                        designer.setHovered('');
                    }}
                >
                    <List.ItemText
                        primary={block.widget}
                        secondary={block.id}
                    />
                </StyledListItemButton>
                <StyledListIndent>
                    <List>
                        {children.map((c) => {
                            return renderBlock(c);
                        })}
                    </List>
                </StyledListIndent>
            </React.Fragment>
        );
    };

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Typography variant="body1">Structure</Typography>
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                <List>{renderBlock(designer.rendered)}</List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
