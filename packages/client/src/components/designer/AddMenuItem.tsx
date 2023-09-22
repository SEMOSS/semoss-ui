import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';

import { ActionMessages, BlockJSON } from '@/stores';
import { useDesigner } from '@/hooks';

const StyledMenuItem = styled('div')(({ theme }) => ({
    ...theme.typography.subtitle2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.spacing(8),
    width: '100%',
    cursor: 'move',
    borderWidth: '1px',
    borderColor: theme.palette.grey['700'],
    '&:hover': {
        backgroundColor: theme.palette.primary.light,
    },
}));

interface AddMenuItemProps {
    /** Name of the Widget */
    name: string;

    /** Data of the Widget */
    json: BlockJSON;
}

export const AddMenuItem = observer((props: AddMenuItemProps) => {
    const { name, json } = props;

    const { designer } = useDesigner();

    // track if it is this one that is dragging
    const [local, setLocal] = useState(false);

    /**
     * Handle the mousedown on the widget.
     */
    const handleMouseDown = () => {
        // set the dragged
        designer.activateDrag(name, () => {
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

                if (siblingWidget.parent) {
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
        <StyledMenuItem onMouseDown={handleMouseDown}>{name}</StyledMenuItem>
    );
});
