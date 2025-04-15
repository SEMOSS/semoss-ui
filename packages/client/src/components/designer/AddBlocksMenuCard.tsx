import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { ReportRounded } from '@mui/icons-material';

import { ActionMessages, useBlocks } from '@semoss/renderer';
import {
    styled,
    Card,
    Tooltip,
    Stack,
    Typography,
    useNotification,
    Icon,
} from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { BlockCardContent, blockCardWidth } from './BlockMenuCardContent';
import {
    BlockLocalStorageData,
    DesignerMenuItem,
} from '../blocks-workspace/menus/menu-types';

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
export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
    const { item } = props;
    const { state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();

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

        // Track block in session storage
        localStorage.setItem(
            'blocks--frequently-used',
            (() => {
                const map: Record<string, BlockLocalStorageData> =
                    JSON.parse(
                        localStorage.getItem('blocks--frequently-used'),
                    ) ?? {};
                map[item.json.widget] = {
                    widget: item.json.widget,
                    name: item.name,
                    use_count: (map[item.json.widget]?.use_count ?? 0) + 1,
                    last_used: Date.now(),
                };
                return JSON.stringify(map);
            })(),
        );

        // apply the action
        const placeholderAction = designer.drag.placeholderAction;
        const sw = state.getBlock(placeholderAction.id);

        // TODO: Add logic to prevent adding block it iter block if one is already present

        if (sw.widget === 'iteration') {
            if (sw.slots.children.children.length) {
                notification.add({
                    color: 'error',
                    message:
                        'Please delete block within iterator before adding another child',
                });
                return;
            }
        }

        if (placeholderAction) {
            if (
                placeholderAction.type === 'before' ||
                placeholderAction.type === 'after'
            ) {
                const siblingWidget = state.getBlock(placeholderAction.id);

                if (siblingWidget?.parent) {
                    const parent = state.getBlock(sw.parent.id);
                    if (parent.widget === 'iteration') {
                        if (parent.slots.children.children.length) {
                            notification.add({
                                color: 'error',
                                message:
                                    'Please delete block within iterator before adding another child',
                            });
                            designer.deactivateDrag();
                            return;
                        }
                    }
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

                if (sw.widget === 'iteration') {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: placeholderAction.id,
                            path: 'child',
                            value: state.getBlock(id),
                        },
                    });
                }
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
        >
            <StyledTypography
                variant="body2"
                fontWeight="medium"
                align="center"
            >
                <Stack
                    direction={'row'}
                    gap={1}
                    alignContent={'center'}
                    justifyContent={'center'}
                >
                    {item.name}
                    {item.isBeta && (
                        <Tooltip
                            title={'This block is currently in beta'}
                            children={
                                <Icon color={'warning'} fontSize="small">
                                    <ReportRounded />
                                </Icon>
                            }
                        />
                    )}
                </Stack>
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
                            image={hovered ? item.hoverImage : item.activeImage}
                            name={item.name}
                        />
                    </div>
                </Tooltip>
            </StyledCard>
        </Stack>
    );
});
