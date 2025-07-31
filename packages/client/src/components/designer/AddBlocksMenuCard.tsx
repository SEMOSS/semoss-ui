import { useState, useEffect, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    DeleteOutline,
    ReportRounded,
    InfoOutlined,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';

import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from '@semoss/renderer';
import {
    styled,
    Card,
    Tooltip,
    Stack,
    Typography,
    useNotification,
    Icon,
    Button,
    IconButton,
    Box,
} from '@semoss/ui';

import { useDesigner, useRootStore } from '@/hooks';
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

    /** Determined for snapshot code */
    isCommunity: boolean;

    /** Handle the trash click */
    handleOnTrashClick: (blockId: string, blockName: string) => void;
}

/**
 * Individaul block that can be dragged onto the UI
 */
export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
    const { item, isCommunity, handleOnTrashClick } = props;
    const { state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();
    const { configStore } = useRootStore();

    const ref = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);

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

        // put a placeholder action to check if it is valid
        const placeholderAction = designer.drag.placeholderAction;
        if (!placeholderAction || !placeholderAction.id) {
            designer.deactivateDrag();
            designer.setHovered('');
            designer.setSelected('');
            setLocal(false);
            return;
        }

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
        const sw = state.getBlock(placeholderAction.id);

        // Safely get the block associated with the placeholder action
        if (!sw) {
            designer.deactivateDrag();
            designer.setHovered('');
            designer.setSelected('');
            setLocal(false);
            return;
        }

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
                    if (!sw.parent || !sw.parent.id) {
                        designer.deactivateDrag();
                        setLocal(false);
                        return;
                    }
                    const parent = state.getBlock(sw.parent.id);
                    if (!parent) {
                        designer.deactivateDrag();
                        setLocal(false);
                        return;
                    }
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
                            isCommunity: isCommunity,
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
                        isCommunity: isCommunity,
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

        // TODO: REFACTOR
        // Add variables for all blocks that are inputs from user
        if (INPUT_BLOCK_TYPES.indexOf(item.json.widget) > -1 && !isCommunity) {
            state.dispatch({
                message: ActionMessages.ADD_VARIABLE,
                payload: {
                    id: id,
                    type: 'block',
                    to: id,
                    isInput: true,
                },
            });
        }

        // clear the drag
        designer.deactivateDrag();

        // clear the hovered
        designer.setHovered('');

        // clear the selected
        designer.setSelected(id ? id : '');

        // clear the selectedBlocks
        designer.addBlockToSelected('clear');

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

    // useEffect(() => {
    //     if (isClient) {
    //         if (ref.current) {
    //             html2canvas(ref.current).then((canvas) => {
    //                 setImageSrc(canvas.toDataURL('image/png'));
    //             });
    //         }
    //     }
    // }, [isClient]);

    // const randomColor = () => {
    //     return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    // };

    return (
        <Stack
            spacing={1}
            alignItems="center"
            height="100%"
            justifyContent="flex-end"
        >
            {/* So we can snapshot picture for client */}
            {/* {isClient && (
                <div
                    ref={ref}
                    style={{ position: 'absolute', left: '-9999px', top: 0 }}
                >
                    <Stack padding={4}>
                        <StyledTypography variant="body2">
                            Show snapshot
                        </StyledTypography>
                        <button
                            style={{
                                backgroundColor: randomColor(),
                                color: '#fff',
                            }}
                        >
                            {item.name}
                        </button>
                    </Stack>
                </div>
            )} */}

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
                    {item.recentChanges && (
                        <Tooltip
                            title={item.recentChanges}
                            children={
                                <Icon color={'info'} fontSize="small">
                                    <InfoOutlined />
                                </Icon>
                            }
                        />
                    )}
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
                    <div style={{ position: 'relative' }}>
                        <BlockCardContent
                            image={
                                isCommunity
                                    ? imageSrc
                                    : hovered
                                    ? item.hoverImage
                                    : item.activeImage
                            }
                            name={item.name}
                        />
                        {hovered &&
                            isCommunity &&
                            configStore.store.user.admin && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        zIndex: 1000,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOnTrashClick(
                                                item['id'],
                                                item.name,
                                            );
                                        }}
                                        color="error"
                                    >
                                        <DeleteOutline />
                                    </IconButton>
                                </Box>
                            )}
                    </div>
                </Tooltip>
            </StyledCard>
        </Stack>
    );
});
