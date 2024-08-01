import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, Typography, styled } from '@semoss/ui';

import {
    ActionMessages,
    getRelativeSize,
    getRootElement,
    getBlockElement,
} from '@/stores';
import { useBlocks, useDesigner } from '@/hooks';

import { DragIndicator } from '@mui/icons-material';
import { getImageForWidget } from './designer.constants';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '20',
    pointerEvents: 'none',
    userSelect: 'none',
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: theme.palette.primary.main,
}));

const StyledTitle = styled('div')(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    position: 'absolute',
    top: theme.spacing(-3),
    left: `-1px`,
    height: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    pointerEvents: 'auto',
    cursor: 'grab',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    whiteSpace: 'nowrap',
}));

/**
 * Show the information of a selected block
 */
export const SelectedMask = observer(() => {
    // create the state
    const [size, setSize] = useState<{
        top: number;
        left: number;
        height: number;
        width: number;
    } | null>(null);
    const [local, setLocal] = useState(false);

    // get the store
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();

    // get the block
    const block = state.getBlock(designer.selected);
    const variableName = state.getAlias(designer.selected);

    // check if it is draggable
    const isDraggable =
        block && registry[block.widget] && block.widget !== 'page';

    /**
     * Handle the mousedown on the block.
     */
    const handleMouseDown = () => {
        if (!isDraggable) {
            return;
        }

        // set the dragged
        designer.activateDrag(
            block.widget,
            (parent) => {
                // if the parent block is a child of the selected, we cannot add
                if (state.containsBlock(designer.selected, parent)) {
                    return false;
                }

                return true;
            },
            block.id,
            getImageForWidget(block.widget),
        );

        // clear the hovered
        designer.setHovered('');

        // set as inactive
        setLocal(true);
    };

    /**
     * Handle the mouseup event on the document
     */
    const handleDocumentMouseUp = useCallback(() => {
        if (!designer.drag.active) {
            return;
        }

        // apply the action
        const placeholderAction = designer.drag.placeholderAction;
        if (placeholderAction) {
            if (
                placeholderAction.type === 'before' ||
                placeholderAction.type === 'after'
            ) {
                const siblingWidget = state.getBlock(placeholderAction.id);

                if (siblingWidget.parent) {
                    state.dispatch({
                        message: ActionMessages.MOVE_BLOCK,
                        payload: {
                            id: designer.selected,
                            position: {
                                parent: siblingWidget.parent.id,
                                slot: siblingWidget.parent.slot,
                                sibling: siblingWidget.id,
                                type: placeholderAction.type,
                            },
                        },
                    });
                }
            } else if (placeholderAction.type === 'replace') {
                state.dispatch({
                    message: ActionMessages.MOVE_BLOCK,
                    payload: {
                        id: designer.selected,
                        position: {
                            parent: placeholderAction.id,
                            slot: placeholderAction.slot,
                        },
                    },
                });
            }
        }

        // clear the drag
        designer.deactivateDrag();

        // clear the hovered
        designer.setHovered('');

        // set as active
        setLocal(false);
    }, [
        designer.selected,
        designer.drag.active,
        designer.drag.placeholderAction,
        state,
        designer,
    ]);

    // reposition the mask
    const repositionMask = () => {
        // get the root element
        const rootEle = getRootElement();

        // get the block elemenent
        const blockEle = getBlockElement(designer.selected);

        if (!blockEle) {
            return;
        }

        // calculate and set the side
        const updated = getRelativeSize(blockEle, rootEle);
        setSize(updated);
    };

    // update the mask when the screen is resized
    useEffect(() => {
        window.addEventListener('resize', repositionMask);
    }, []);

    // block resized is a custom event emitted by SizeSettings
    // so we know to updated the mask when width/height changes
    useEffect(() => {
        window.addEventListener('blockResized', repositionMask);
    }, []);

    // get the root, watch changes, and reposition the mask
    useLayoutEffect(() => {
        // get the root element
        const rootEle = getRootElement();

        const observer = new MutationObserver(() => {
            repositionMask();
        });

        observer.observe(rootEle, {
            subtree: true,
            childList: true,
        });

        // reposition it
        repositionMask();

        return () => observer.disconnect();
    }, [designer.selected]);

    // add the mouse up listener when dragged
    useEffect(() => {
        if (!designer.drag.active || !local) {
            return;
        }

        document.addEventListener('mouseup', handleDocumentMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        };
    }, [designer.drag.active, local, handleDocumentMouseUp]);

    if (!size) {
        return <></>;
    }

    return (
        <StyledContainer
            style={{
                top: `${size.top}px`,
                left: `${size.left}px`,
                height: `${size.height}px`,
                width: `${size.width}px`,
                opacity: designer.drag.active ? 0 : 1,
            }}
        >
            <StyledTitle onMouseDown={handleMouseDown}>
                <Stack direction={'row'}>
                    <Typography variant={'body2'}>
                        {variableName ? variableName : designer.selected}
                    </Typography>
                </Stack>
                {isDraggable && (
                    <DragIndicator
                        fontSize="inherit"
                        sx={{ marginLeft: '2px' }}
                    />
                )}
            </StyledTitle>
        </StyledContainer>
    );
});
