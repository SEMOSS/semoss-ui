import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Card, Tooltip } from '@semoss/ui';

import { ActionMessages } from '@/stores';
import { useBlocks, useDesigner } from '@/hooks';
import { AddBlocksMenuItem, getImageForWidget } from './designer.constants';
import { THEME } from '@/constants';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    width: '100%',
    padding: theme.spacing(2),
    cursor: 'grab',
    border: `1px solid rgba(0, 0, 0, 0.23)`,
    //TODO: styled needs to be updated to match the theme
    borderRadius: '12px', //  theme.shape.borderRadiusLg
}));

export interface AddBlocksMenuItemProps {
    /** Item that can be dragged onto the block */
    item: AddBlocksMenuItem;
}

/**
 * Individaul block that can be dragged onto the UI
 */
export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
    const { item } = props;
    const { state } = useBlocks();
    const { designer } = useDesigner();

    // track if it is this one that is dragging
    const [local, setLocal] = useState(false);

    /**
     * Handle the mousedown on the widget.
     */
    const handleMouseDown = () => {
        // set the dragged
        designer.activateDrag(
            item.json.widget,
            () => {
                return true;
            },
            item.name,
            getImageForWidget(item.json.widget),
        );

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
    const handleDocumentMouseUp = useCallback(async () => {
        if (!designer.drag.active) {
            return;
        }

        // ID of newly added block
        let id = '';

        // apply the action
        const placeholderAction = designer.drag.placeholderAction;
        if (placeholderAction) {
            if (
                placeholderAction.type === 'before' ||
                placeholderAction.type === 'after'
            ) {
                const siblingWidget = state.getBlock(placeholderAction.id);

                if (siblingWidget?.parent) {
                    id = await state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: item.json,
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
                id = await state.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: item.json,
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
        designer.setSelected(id ? id : '');

        // set as active
        setLocal(false);
    }, [
        item.json,
        designer.drag.active,
        designer.drag.placeholderAction,
        designer,
        state,
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
        <StyledCard onMouseDown={handleMouseDown}>
            <Tooltip title={`Add ${item.name}`}>
                <img draggable={false} src={item.image || THEME.logo} />
            </Tooltip>
        </StyledCard>
    );
});
