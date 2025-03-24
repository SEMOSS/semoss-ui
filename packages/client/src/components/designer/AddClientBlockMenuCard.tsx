import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

import { ActionMessages, useBlocks } from '@semoss/renderer';
import { styled, Card, Tooltip, Stack, Typography } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import {
    BlockLocalStorageData,
    DesignerMenuItem,
} from '../blocks-workspace/menus/menu-types';
import { BlockCardContent, blockCardWidth } from './BlockMenuCardContent';

const StyledCard = styled(Card)({
    cursor: 'grab',
    border: `1px solid rgba(0, 0, 0, 0.12)`,
    //TODO: styled needs to be updated to match the theme
    borderRadius: '6px',
    justifyContent: 'center',
});

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    width: blockCardWidth,
    userSelect: 'none',
}));

export interface AddBlocksMenuItemProps {
    /** Item that can be dragged onto the block */
    item: DesignerMenuItem;
}

/**
 * Individaul block that can be dragged onto the UI
 */
export const AddClientBlocksMenuCard = observer(
    (props: AddBlocksMenuItemProps) => {
        const { item } = props;
        const { state } = useBlocks();
        const { designer } = useDesigner();

        console.log('Grouped Component Definition:', item);
        // TODO:
        // At the end of the day for this grouped component we need to be able to append to state all the neccessary block configs in order to get it to work

        // track if it is this one that is dragging
        const [local, setLocal] = useState(false);

        // track if this is being hovered
        const [hovered, setHovered] = useState<boolean>(false);

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
                item.hoverImage,
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

            // ID of newly added block
            let id = '';

            debugger;
            // apply the action
            const placeholderAction = designer.drag.placeholderAction;
            console.log(placeholderAction, 'placeholderAction');
            if (placeholderAction) {
                if (
                    placeholderAction.type === 'before' ||
                    placeholderAction.type === 'after'
                ) {
                    const siblingWidget = state.getBlock(placeholderAction.id);

                    if (siblingWidget?.parent) {
                        id = state.dispatch({
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
                        }) as string;
                    }
                } else if (placeholderAction.type === 'replace') {
                    id = state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: item.json,
                            position: {
                                parent: placeholderAction.id,
                                slot: placeholderAction.slot,
                            },
                        },
                    }) as string;
                }
            }

            // clear the drag
            designer.deactivateDrag();

            // clear the hovered
            designer.setHovered('');

            // // clear the selected
            // designer.setSelected(id ? id : '');

            // set as active
            setLocal(false);
        }, [
            item.name,
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
            <Stack
                spacing={1}
                alignItems="center"
                height="100%"
                justifyContent="flex-end"
                border="1px solid red"
            >
                <StyledTypography
                    variant="body2"
                    fontWeight="medium"
                    align="center"
                >
                    {item.name}
                </StyledTypography>
                <StyledCard onMouseDown={handleMouseDown}>
                    <Tooltip
                        title={item.helperText ?? item.name}
                        arrow
                        placement="bottom"
                        onOpen={() => setHovered(true)}
                        onClose={() => setHovered(false)}
                    >
                        <div>
                            <BlockCardContent
                                image={
                                    hovered ? item.hoverImage : item.activeImage
                                }
                                name={item.name}
                            />
                        </div>
                    </Tooltip>
                </StyledCard>
            </Stack>
        );
    },
);
