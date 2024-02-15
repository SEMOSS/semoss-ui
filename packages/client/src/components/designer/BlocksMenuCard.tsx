import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Card } from '@semoss/ui';

import { ActionMessages } from '@/stores';
import { useBlocks, useDesigner } from '@/hooks';
import { BlocksMenuCardContent } from './BlocksMenuCardContent';
import { BlocksMenuItem } from './BlocksMenuBlocks';

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: '8px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    cursor: 'grab',
    width: theme.spacing(11),
    height: theme.spacing(12),
}));

export const BlocksMenuCard = observer(
    (props: { menuItem: BlocksMenuItem }) => {
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
                props.menuItem.blockJson.widget,
                () => {
                    return true;
                },
                props.menuItem.display,
                props.menuItem.icon,
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

                    if (siblingWidget?.parent) {
                        state.dispatch({
                            message: ActionMessages.ADD_BLOCK,
                            payload: {
                                json: props.menuItem.blockJson,
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
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: props.menuItem.blockJson,
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
            props.menuItem.blockJson,
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
                <BlocksMenuCardContent
                    display={props.menuItem.display}
                    icon={props.menuItem.icon}
                />
            </StyledCard>
        );
    },
);
