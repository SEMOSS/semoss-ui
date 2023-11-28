import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Card } from '@semoss/ui';

import { ActionMessages, BlockConfig, BlockJSON } from '@/stores';
import { useDesigner } from '@/hooks';
import { BlocksMenuCardContent } from './BlocksMenuCardContent';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isDragging'
})<{
    isDragging: boolean
}>(({ isDragging }) => ({
    borderRadius: '8px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    cursor: isDragging ? 'grabbing' : 'grab'
}));

export const BlocksMenuCard = observer((props: {
    block: BlockConfig
}) => {
    const json: BlockJSON = {
        widget: props.block.widget,
        data: props.block.data,
        slots: (props.block.slots || {}) as BlockJSON['slots'],
        listeners: props.block.listeners || {},
    }

    const { designer } = useDesigner();

    // track if it is this one that is dragging
    const [local, setLocal] = useState(false);

    /**
     * Handle the mousedown on the widget.
     */
    const handleMouseDown = () => {
        // set the dragged
        designer.activateDrag(props.block.widget, () => {
            return true;
        });

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected('');

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
                const siblingWidget = designer.blocks.getBlock(
                    placeholderAction.id,
                );

                if (siblingWidget?.parent) {
                    designer.blocks.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: json,
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
                designer.blocks.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: json,
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

        // clear the selected
        designer.setSelected('');

        // set as active
        setLocal(false);
    }, [
        json,
        designer.drag.active,
        designer.drag.placeholderAction,
        designer,
        designer.blocks,
    ]);

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

    return (
        <StyledCard 
            isDragging={!!designer.drag.ghostWidget}
            onMouseDown={handleMouseDown}
        >
            <BlocksMenuCardContent
                widget={props.block.widget}
                icon={props.block.icon}
            />
        </StyledCard>
    );
});