import { useLayoutEffect, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';

import { styled, ButtonGroup, Button, IconButton, Tooltip } from '@semoss/ui';
import { ContentCopy, Delete, DeleteOutline } from '@mui/icons-material';

import { getRelativeSize, getBlockElement } from '@/stores';

import { useDesigner } from '@/hooks';
import { BlockJSON, ActionMessages, useBlocks } from '@semoss/renderer';

const STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH = 48;
const STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT = 32;

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    padding: theme.spacing(2),
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '30',
    width: `${STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH}px`,
    height: `${STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT}px`,
}));

const StyledButtonGroup = styled(ButtonGroup)(() => ({
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)', // custom from design
    backgroundColor: 'white',
}));

const StyledButtonGroupIconButton = styled(IconButton)(({ theme }) => ({
    width: `${STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH}px`,
    backgroundColor: 'white',
    borderRadius: theme.shape.borderRadius,
}));

interface DeleteDuplicateMaskProps {
    /** Element to bind the mask to */
    screenEle: HTMLDivElement;
}

export const DeleteDuplicateMask = observer(
    (props: DeleteDuplicateMaskProps) => {
        const { screenEle } = props;

        // create the state
        const [size, setSize] = useState<{
            top: number;
            left: number;
            height: number;
            width: number;
        } | null>(null);

        // get the store
        const { registry, state } = useBlocks();
        const { designer } = useDesigner();

        // get the block
        const block = state.getBlock(designer.selected);

        // check if it is visible
        const isVisible =
            block && registry[block.widget] && block.widget !== 'page';

        // get the root, watch changes, and reposition the mask
        useLayoutEffect(() => {
            if (!isVisible) {
                return;
            }

            // reposition the mask
            const repositionMask = () => {
                // get the block element
                const blockEle = getBlockElement(designer.selected);

                if (!blockEle) {
                    return;
                }

                // calculate and set the side
                const updated = getRelativeSize(blockEle, screenEle);
                setSize(updated);
            };

            const observer = new MutationObserver(() => {
                repositionMask();
            });

            observer.observe(screenEle, {
                subtree: true,
                childList: true,
            });

            // reposition it
            repositionMask();

            return () => observer.disconnect();
        }, [designer.selected, isVisible]);

        if (!size || !isVisible) {
            return <></>;
        }

        const getStyle = () => {
            // get position of page root block element
            const screenElementSize = screenEle.getBoundingClientRect();
            // get position of selected block element
            const selectedElement = getBlockElement(designer.selected);
            const selectedElementSize = selectedElement.getBoundingClientRect();

            // check for overflow
            const hasLeftOverflow =
                screenElementSize.left === selectedElementSize.left &&
                selectedElementSize.width <
                    STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2;
            const hasRightOverflow =
                screenElementSize.right === selectedElementSize.right &&
                selectedElementSize.width <
                    STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2;

            const leftValue =
                size.left +
                size.width -
                STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2 -
                12;

            let left: string;
            if (hasRightOverflow) {
                left = `${
                    leftValue -
                    (STYLED_BUTTON_GROUP_ICON_BUTTON_WIDTH * 2 -
                        selectedElementSize.width) +
                    8
                }px`;
            } else if (hasLeftOverflow) {
                left = `${size.left - 8}px`;
            } else {
                left = `${leftValue}px`;
            }

            const top = size.top - STYLED_BUTTON_GROUP_ICON_BUTTON_HEIGHT * 2;

            return { top, left };
        };

        const onClear = () => {
            // dispatch the event
            state.dispatch({
                message: ActionMessages.REMOVE_BLOCK,
                payload: {
                    id: designer.selected,
                    keep: true,
                },
            });

            // clear the selected value
            designer.setSelected('');
        };

        /**
         * Delete the block
         */
        const onDelete = () => {
            // dispatch the event
            const block = state.blocks[designer.selected];
            if (block.parent !== null) {
                const parentBlock = state.blocks[block.parent.id];

                if (
                    parentBlock.widget === 'iterator' &&
                    Array.isArray(parentBlock.data.sourceBlockList) &&
                    parentBlock.data.sourceBlockList.some(
                        (b: { id: string }) => b.id === designer.selected,
                    )
                ) {
                    const parentSlot = parentBlock.slots[block.parent.slot];

                    if (parentSlot.children.length > 0) {
                        // Remove the selected block from children
                        parentSlot.children = parentSlot.children.filter(
                            (childId) => childId !== designer.selected,
                        );

                        // Filter children to keep only those starting with block.widget (e.g., "button")
                        const filteredChildren = parentSlot.children.filter(
                            (childId) => childId.startsWith(block.widget),
                        );
                        if (filteredChildren.length > 0) {
                            // Find the full block object from state.blocks
                            const firstFilteredBlock =
                                state.blocks[filteredChildren[0]];
                            if (
                                firstFilteredBlock.slots.children.children
                                    .length > 0
                            ) {
                            }
                            if (firstFilteredBlock) {
                                const convertSlotsToJson = (slots: any) => {
                                    const slotJson: Record<string, any[]> = {};

                                    for (const slot in slots) {
                                        slotJson[slot] = slots[slot].children
                                            .map((childId: string) => {
                                                const childBlock =
                                                    state.blocks[childId];
                                                if (!childBlock) return null;

                                                return {
                                                    widget: toJS(
                                                        childBlock.widget,
                                                    ),
                                                    data: toJS(childBlock.data),
                                                    listeners: toJS(
                                                        childBlock.listeners,
                                                    ),
                                                    slots: convertSlotsToJson(
                                                        childBlock.slots,
                                                    ), // Recursively process slots
                                                };
                                            })
                                            .filter(Boolean); // Remove null values if any child block is missing
                                    }

                                    return slotJson;
                                };

                                const blockJson = {
                                    widget: toJS(firstFilteredBlock.widget),
                                    data: toJS(firstFilteredBlock.data),
                                    listeners: toJS(
                                        firstFilteredBlock.listeners,
                                    ),
                                    slots: firstFilteredBlock.slots.children
                                        ? convertSlotsToJson(
                                              firstFilteredBlock.slots,
                                          )
                                        : {}, // Convert slot IDs to full JSON blocks
                                };

                                const payload = {
                                    json: blockJson,
                                };

                                const blockObject = {
                                    json: payload.json,
                                    id: firstFilteredBlock.id,
                                };

                                // Push the entire block object (not just ID) to sourceBlockList
                                (
                                    parentBlock.data.sourceBlockList as object[]
                                ).push(blockObject);
                            }
                        }

                        // Remove designer.selected from sourceBlockList
                        parentBlock.data.sourceBlockList = (
                            parentBlock.data.sourceBlockList as object[]
                        ).filter(
                            (b: { id: string }) => b.id !== designer.selected,
                        );
                    }
                }
            }
            state.dispatch({
                message: ActionMessages.REMOVE_BLOCK,
                payload: {
                    id: designer.selected,
                    keep: false,
                },
            });

            // clear the selected value
            designer.setSelected('');
        };

        const onDuplicate = async () => {
            // get the json for the block to add
            const getJsonForBlock = (id: string) => {
                const block = state.blocks[id];

                const blockJson = {
                    widget: toJS(block.widget),
                    data: toJS(block.data),
                    listeners: toJS(block.listeners),
                    slots: {},
                };

                // generate the slots
                for (const slot in block.slots) {
                    if (block.slots[slot]) {
                        blockJson.slots[slot] = block.slots[slot].children.map(
                            (childId) => {
                                return getJsonForBlock(childId);
                            },
                        );
                    }
                }

                // return it
                return blockJson;
            };

            const position = block?.parent?.id
                ? {
                      parent: block.parent.id,
                      slot: block.parent.slot,
                      sibling: block.id,
                      type: 'after',
                  }
                : undefined;

            const id = await state.dispatch({
                message: ActionMessages.ADD_BLOCK,
                payload: {
                    json: getJsonForBlock(block.id) as BlockJSON,
                    position: position,
                },
            });

            designer.setSelected(id ? (id as string) : '');
        };

        // TODO: revisit these actions for the base page once multiple pages/routing is enabled

        return (
            <StyledContainer id="delete-duplicate-mask" style={getStyle()}>
                <StyledButtonGroup>
                    <Tooltip title="Duplicate">
                        <StyledButtonGroupIconButton
                            sx={{ color: '#757575' }}
                            size="small"
                            onClick={onDuplicate}
                        >
                            <ContentCopy />
                        </StyledButtonGroupIconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <StyledButtonGroupIconButton
                            sx={{ color: '#757575' }}
                            onClick={
                                designer.rendered === designer.selected
                                    ? onClear
                                    : onDelete
                            }
                        >
                            <DeleteOutline />
                        </StyledButtonGroupIconButton>
                    </Tooltip>
                </StyledButtonGroup>
            </StyledContainer>
        );
    },
);
