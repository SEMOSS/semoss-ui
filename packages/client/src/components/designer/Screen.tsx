import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';
import { useBlocks, useDesigner } from '@/hooks';

import {
    getRelativeSize,
    getNearestBlock,
    getNearestBlockElement,
    getNearestSlot,
    getNearestSlotElement,
} from '@/stores';

import { SelectedMask } from './SelectedMask';
import { HoveredMask } from './HoveredMask';
import { Placeholder } from './Placeholder';
import { Ghost } from './Ghost';
import { DeleteDuplicateMask } from './DeleteDuplicateMask';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexGrow: 1,
    // padding: `${theme.spacing(2.5)} ${theme.spacing(2)}`,
    overflow: 'auto',
}));

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'off',
})<{
    /** Track if the drag is on */
    off: boolean;
}>(({ off }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    userSelect: off ? 'none' : 'auto',
    flexGrow: '1',
}));

const StyledContentOuter = styled('div')(({ theme }) => ({
    padding: theme.spacing(1),
    display: 'flex',
    flex: 1,
    minWidth: '100%',
    height: '100%',
}));

const StyledContentInner = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isHoveredOverSelectedBlock',
})<{ isHoveredOverSelectedBlock: boolean }>(
    ({ isHoveredOverSelectedBlock }) => ({
        flex: 1,
        position: 'relative',
        minWidth: '100%',
        height: '100%',
        cursor: !isHoveredOverSelectedBlock ? 'pointer!important' : 'inherit',
        // iframes should not get pointer events in design mode
        iframe: {
            pointerEvents: 'none!important',
        },
        // page scrolling is handled in the designer in design mode
        '[data-page]': {
            overflow: 'unset!important',
            minHeight: '100%',
        },
    }),
);

interface ScreenProps {
    /** Children to render */
    children: React.ReactNode;
}

export const Screen = observer((props: ScreenProps) => {
    const { children } = props;

    // save the ref
    const rootRef = useRef<HTMLDivElement | null>(null);

    // get the designer
    const { state } = useBlocks();
    const { designer } = useDesigner();

    /**
     * Handle the click events on the page. This will select the hovered block and prevent block clicks if it hasn't been selected yet.
     *
     *  @param event - mouse event
     */
    const handleClickCapture = (event: React.MouseEvent) => {
        if (!designer.hovered || designer.hovered === designer.selected) {
            return;
        }

        // prevent click events for elements until selected
        event.stopPropagation();
        event.preventDefault();

        designer.setSelected(designer.hovered);
    };

    /**
     * Handle the mouseover on the page. This will hover the nearest block.
     *
     *  @param event - mouse event
     */
    const handleMouseOver = (event: React.MouseEvent) => {
        const id = getNearestBlock(event.target as Element);

        if (!id || id == designer.hovered) {
            return;
        }

        designer.setHovered(id);
    };

    /**
     * Handle the mouseleave on the page. This will deselect hovered widgets
     */
    const handleMouseLeave = (event: React.MouseEvent) => {
        designer.setHovered('');

        // reset the placeholder / clear the ghost if is its off the screen
        if (designer.drag.active) {
            designer.resetPlaceholder();
            designer.updateGhostPosition(null);
        }
    };

    /**
     * Handle the mousemove event on the document. This will render the placeholder based on the target block.
     */
    const handleDocumentMouseMove = useCallback(
        (event: MouseEvent) => {
            // if there is nothing dragged ignore it
            if (!designer.drag.active) {
                return;
            }

            // if there is not root ref ignore it
            if (!rootRef.current) {
                return;
            }

            // prevent the default action (scroll + text selection)
            event.preventDefault();

            // update the ghost
            designer.updateGhostPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // get the nearest element, this will be used to update the position of the place holder
            const nearestElement = getNearestBlockElement(
                event.target as Element,
            );

            if (!nearestElement) {
                return;
            }

            // get the id from the element
            const id = getNearestBlock(nearestElement) as string;

            // set the hovered
            designer.setHovered(id);

            // try to add to the slot if its present
            const slotElement = getNearestSlotElement(event.target as Element);
            if (slotElement) {
                const slot = getNearestSlot(slotElement) as string;

                // check if we can drop
                if (!designer.drag.canDrop(id, slot)) {
                    return;
                }

                // update
                designer.updatePlaceholder(
                    {
                        type: 'replace',
                        id: id,
                        slot: slot,
                    },
                    getRelativeSize(slotElement, rootRef.current),
                );

                return;
            }

            // get the block
            const block = state.getBlock(id);

            // if there is no parent, we cannot add
            if (!block.parent) {
                return;
            }

            // check if we can drop
            if (!designer.drag.canDrop(block.parent.id, block.parent.slot)) {
                return;
            }

            // calculate the current percent of the block
            const widgetClientRect = nearestElement.getBoundingClientRect();
            const percent = Math.round(
                ((event.clientY - widgetClientRect.y) /
                    widgetClientRect.height) *
                    100,
            );

            if (percent <= 30) {
                designer.updatePlaceholder(
                    {
                        type: 'before',
                        id: id,
                    },
                    getRelativeSize(nearestElement, rootRef.current),
                );
            } else if (percent >= 70) {
                designer.updatePlaceholder(
                    {
                        type: 'after',
                        id: id,
                    },
                    getRelativeSize(nearestElement, rootRef.current),
                );
            }
        },
        [designer.drag.active, designer.drag.canDrop, designer, state],
    );

    // add the mouse up listener when dragged
    useEffect(() => {
        if (!designer.drag.active) {
            return;
        }

        document.addEventListener('mousemove', handleDocumentMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
        };
    }, [designer.drag.active, handleDocumentMouseMove]);

    const isHoveredOverSelectedBlock = useMemo(() => {
        return designer.hovered == designer.selected;
    }, [designer.hovered, designer.selected, handleMouseOver]);

    return (
        <StyledContainer data-block="root" ref={rootRef}>
            {designer.selected && <SelectedMask />}
            {designer.hovered && <HoveredMask />}
            {designer.selected && !designer.drag.active && (
                <DeleteDuplicateMask />
            )}
            {designer.drag.active && <Placeholder />}
            {designer.drag.active && <Ghost />}

            <StyledContent off={designer.drag.active ? true : false}>
                <StyledContentOuter onMouseLeave={handleMouseLeave}>
                    <StyledContentInner
                        onMouseOver={handleMouseOver}
                        isHoveredOverSelectedBlock={isHoveredOverSelectedBlock}
                        onClickCapture={handleClickCapture}
                    >
                        {children}
                    </StyledContentInner>
                </StyledContentOuter>
            </StyledContent>
        </StyledContainer>
    );
});
