import { useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, styled } from '@semoss/ui';

import { getRelativeSize, getRootElement, getBlockElement } from '@/stores';
import { useDesigner } from '@/hooks';

interface StyledContainerProps {
    top: number;
    left: number;
    height: number;
    width: number;
    hideHoveredMask: boolean;
}

const StyledContainer = styled('div', {
    shouldForwardProp: (prop) =>
        !['top', 'left', 'height', 'width', 'hideHoveredMask'].includes(
            prop as string,
        ),
})<StyledContainerProps>(
    ({ theme, top, left, height, width, hideHoveredMask }) => ({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        width: `${width}px`,
        zIndex: '20',
        opacity: hideHoveredMask ? 0 : 1,
        pointerEvents: 'none',
        // outlineWidth: '2px',
        // outlineStyle: 'solid',
        // outlineColor: theme.palette.primary.light,
        // outlineWidth: '2px',
        // outlineStyle: 'solid',
        outlineWidth: '3px',
        outlineStyle: 'dotted',
        outlineColor: theme.palette.primary.dark,
    }),
);

const StyledTitle = styled('div')(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    position: 'absolute',
    top: theme.spacing(-3),
    left: `-1px`,
    height: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    //added to match figma
    borderRadius: '4px',
    // backgroundColor: theme.palette.primary.light,
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
    whiteSpace: 'nowrap',
}));

/**
 * Show the information of a hovered block
 */
export const HoveredMask = observer(() => {
    // create the state
    const [size, setSize] = useState<{
        top: number;
        left: number;
        height: number;
        width: number;
    } | null>(null);

    // get the store
    const { designer } = useDesigner();

    // get the root, watch changes, and reposition the mask
    useLayoutEffect(() => {
        // get the root element
        const rootEle = getRootElement();

        // reposition the mask
        const repositionMask = () => {
            // get the block element
            const blockEle = getBlockElement(designer.hovered);

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
    }, [designer.hovered]);

    if (!size) {
        return <></>;
    }

    return (
        <StyledContainer
            top={size.top}
            left={size.left}
            height={size.height}
            width={size.width}
            hideHoveredMask={
                designer.hovered === designer.selected || designer.drag.active
            }
        >
            <StyledTitle>
                <Typography variant={'body2'}>{designer.hovered}</Typography>
            </StyledTitle>
        </StyledContainer>
    );
});
