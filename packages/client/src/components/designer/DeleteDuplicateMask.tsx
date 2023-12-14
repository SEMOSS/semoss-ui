import { useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, ButtonGroup, Button } from '@semoss/ui';

import { getRelativeSize, getRootElement, getBlockElement } from '@/stores';
import { useBlock, useDesigner } from '@/hooks';
import { ContentCopy, Delete } from '@mui/icons-material';

const STYLED_BUTTON_GROUP_BUTTON_WIDTH = 116;
const STYLED_BUTTON_GROUP_BUTTON_HEIGHT = 32;

const StyledContainer = styled('div')(() => ({
    position: 'absolute',
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
    const { designer } = useDesigner();
    const { clearBlock, deleteBlock, duplicateBlock } = useBlock(
        designer.selected,
    );

    // get the root, watch changes, and reposition the mask
    useLayoutEffect(() => {
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
    }, [designer.selected]);

    if (!size) {
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
        const positionBelow =
            selectedElementSize.top <=
            rootElementSize.top + rootElementSize.height / 3;
        const hasBottomOverflow =
            rootElementSize.bottom === selectedElementSize.bottom &&
            positionBelow;

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

        const topValue = positionBelow
            ? size.top + size.height + 10
            : size.top - 60;
        let top: string;
        if (hasBottomOverflow) {
            top = `${topValue - 60}px`;
        } else {
            top = `${topValue}px`;
        }

        return { top, left };
    };

    const onClear = () => {
        designer.setSelected('');
        clearBlock();
    };

    const onDelete = () => {
        designer.setSelected('');
        deleteBlock();
    };

    const onDuplicate = () => {
        designer.setSelected('');
        duplicateBlock();
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
