import { useLayoutEffect, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { styled, ButtonGroup, Button } from '@semoss/ui';
import { ContentCopy, Delete } from '@mui/icons-material';

import {
    ActionMessages,
    getRelativeSize,
    getRootElement,
    getBlockElement,
    BlockJSON,
} from '@/stores';
import { useBlocks, useDesigner } from '@/hooks';

const STYLED_BUTTON_GROUP_BUTTON_WIDTH = 116;
const STYLED_BUTTON_GROUP_BUTTON_HEIGHT = 32;

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    padding: theme.spacing(2),
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '30',
    width: `${STYLED_BUTTON_GROUP_BUTTON_WIDTH}px`,
    height: `${STYLED_BUTTON_GROUP_BUTTON_HEIGHT}px`,
}));

const StyledButtonGroup = styled(ButtonGroup)(() => ({
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)', // custom from design team
}));
const StyledButtonGroupButton = styled(Button)(() => ({
    width: `${STYLED_BUTTON_GROUP_BUTTON_WIDTH}px`,
    backgroundColor: 'white',
    boxShadow:
        '0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0px 1px 5px 0px rgba(0,0,0,0.12)',
}));

export const DeleteDuplicateMask = observer(() => {
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

        // get the root element
        const rootEle = getRootElement();

        // reposition the mask
        const repositionMask = () => {
            // get the block element
            const blockEle = getBlockElement(designer.selected);

            if (!blockEle) {
                return;
            }

            // calculate and set the side
            const updated = getRelativeSize(blockEle, rootEle);
            setSize(updated);
        };

        const observer = new MutationObserver(() => {
            repositionMask();
        });

        observer.observe(rootEle, {
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
        const rootElement = getRootElement();
        const rootElementSize = rootElement.getBoundingClientRect();
        // get position of selected block element
        const selectedElement = getBlockElement(designer.selected);
        const selectedElementSize = selectedElement.getBoundingClientRect();

        // check for overflow
        const hasLeftOverflow =
            rootElementSize.left === selectedElementSize.left &&
            selectedElementSize.width < STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2;
        const hasRightOverflow =
            rootElementSize.right === selectedElementSize.right &&
            selectedElementSize.width < STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2;

        const leftValue =
            size.left + size.width / 2 - STYLED_BUTTON_GROUP_BUTTON_WIDTH;
        let left: string;
        if (hasRightOverflow) {
            left = `${
                leftValue -
                (STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2 -
                    selectedElementSize.width) +
                8
            }px`;
        } else if (hasLeftOverflow) {
            left = `${size.left - 8}px`;
        } else {
            left = `${leftValue}px`;
        }

        const top = size.top + size.height;

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

        designer.setSelected(id ? id : '');
    };

    // TODO: revisit these actions for the base page once multiple pages/routing is enabled

    return (
        <StyledContainer id="delete-duplicate-mask" style={getStyle()}>
            <StyledButtonGroup>
                <StyledButtonGroupButton
                    color="inherit"
                    size="small"
                    startIcon={<ContentCopy />}
                    variant="contained"
                    onClick={onDuplicate}
                >
                    Duplicate
                </StyledButtonGroupButton>
                <StyledButtonGroupButton
                    color="inherit"
                    size="small"
                    startIcon={<Delete />}
                    variant="contained"
                    onClick={
                        designer.rendered === designer.selected
                            ? onClear
                            : onDelete
                    }
                >
                    Delete
                </StyledButtonGroupButton>
            </StyledButtonGroup>
        </StyledContainer>
    );
});
