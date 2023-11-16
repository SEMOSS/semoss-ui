import { useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, styled } from '@semoss/ui';

import { getRelativeSize, getRootElement, getBlockElement } from '@/stores';
import { useDesigner } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    zIndex: '20',
    pointerEvents: 'none',
    userSelect: 'none',
    outlineWidth: '1px',
    outlineStyle: 'solid',
    outlineColor: theme.palette.secondary.main,
}));

const StyledTitle = styled('div')(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    position: 'absolute',
    padding: theme.spacing(4), // Needed?
    top: theme.spacing(-3),
    left: `-1px`,
    height: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    pointerEvents: 'auto',
    backgroundColor: theme.palette.secondary.main,
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
            // get the block elemenent
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
            style={{
                top: `${size.top}px`,
                left: `${size.left}px`,
                height: `${size.height}px`,
                width: `${size.width}px`,
                opacity: designer.drag.active ? 0 : 1,
            }}
        >
            <StyledTitle>
                <Typography variant={'body2'}>{designer.hovered}</Typography>
            </StyledTitle>
        </StyledContainer>
    );
});
