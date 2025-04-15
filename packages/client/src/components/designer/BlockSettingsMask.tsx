import { useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { styled } from '@semoss/ui';
import { useBlocks } from '@semoss/renderer';

import { useDesigner } from '@/hooks';
import { getRelativeSize, getBlockElement } from '@/stores';
import { TextSettingsMask } from './settings-mask/TextSettingsMask';

const STYLED_FONT_STYLE_INPUT_WIDTH = 232;
const STYLED_FONT_SIZE_INPUT_WIDTH = 168;

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    padding: theme.spacing(1, 0, 0, 2),
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '30',
    height: 'fit-content',
    maxWidth: `${
        STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH
    }px`,
    minWidth: 'fit-content',
}));

interface FontStyleSizeMaskProps {
    /** Element to bind the mask to */
    screenEle: HTMLDivElement;
}

export const BlockSettingsMask = observer((props: FontStyleSizeMaskProps) => {
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
        if (!isVisible || block.widget !== 'text') {
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

    /**
     * Calculates the style properties for positioning an element relative to the screen and
     * the selected block element. It determines the top and left positions, taking into account
     * potential overflow on the left or right side of the screen.
     *
     * @returns {Object} - An object containing `top` and `left` style properties in pixels.
     */
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
                STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH;
        const hasRightOverflow =
            screenElementSize.right === selectedElementSize.right &&
            selectedElementSize.width <
                STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH;

        const leftValue = size.left - 12;
        let left: string;
        if (hasRightOverflow) {
            left = `${
                leftValue -
                (STYLED_FONT_STYLE_INPUT_WIDTH +
                    STYLED_FONT_SIZE_INPUT_WIDTH -
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

    return (
        <>
            {block.widget === 'text' && (
                <StyledContainer id="delete-duplicate-mask" style={getStyle()}>
                    <TextSettingsMask />
                </StyledContainer>
            )}
        </>
    );
});
