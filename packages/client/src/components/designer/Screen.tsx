import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';
import { useDesigner } from '@/hooks';

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

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingRight: theme.spacing(2),
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
    minWidth: '100%',
    minHeight: '100%',
}));

const StyledContentOuter = styled('div')(({ theme }) => ({
    padding: theme.spacing(1),
    display: 'flex',
    flex: 1,
    minWidth: '100%',
    minHeight: '100%',
}));

const StyledContentInner = styled('div')(() => ({
    flex: 1,
    position: 'relative',
    minWidth: '100%',
    minHeight: '100%',
}));

interface ScreenProps {
    /** Children to render */
    children: React.ReactNode;
}

export const Screen = observer((props: ScreenProps) => {
    const { children } = props;

    // save the ref
    const rootRef = useRef<HTMLDivElement | null>(null);

    // get the designer
    const { designer } = useDesigner();

    /**
     * Handle the mousedown on the page. This will select the nearest block.
     *
     *  @param event - mouse event
     */
    const handleMouseDown = (event: React.MouseEvent) => {
        const id = getNearestBlock(event.target as Element);

        // if there is no id ignore it
        if (!id) {
            return;
        }

        designer.setSelected(id);
    };

    /**
     * Handle the mouseover on the page. This will hover the nearest block.
     *
     *  @param event - mouse event
     */
    const handleMouseOver = (event: React.MouseEvent) => {
        const id = getNearestBlock(event.target as Element);

        // if there is no id ignore it
        if (!id) {
            return;
        }

        designer.setHovered(id);
    };

    /**
     * Handle the mouseleave on the page. This will deselect hovered widgets
     */
    const handleMouseLeave = () => {
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
            const block = designer.blocks.getBlock(id);

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
        [
            designer.drag.active,
            designer.drag.canDrop,
            designer,
            designer.blocks,
        ],
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

    return (
        <StyledContainer data-block="root" ref={rootRef}>
            {designer.selected && <SelectedMask />}
            {designer.hovered && <HoveredMask />}
            {designer.drag.active && <Placeholder />}
            {designer.drag.active && <Ghost />}

            <StyledContent off={designer.drag.active ? true : false}>
                <StyledContentOuter onMouseLeave={handleMouseLeave}>
                    <StyledContentInner
                        onMouseDown={handleMouseDown}
                        onMouseOver={handleMouseOver}
                    >
                        {children}
                    </StyledContentInner>
                </StyledContentOuter>
            </StyledContent>
        </StyledContainer>
    );
});
