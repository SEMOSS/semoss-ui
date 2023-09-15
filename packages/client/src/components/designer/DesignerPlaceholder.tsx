import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { DesignerStoreInterface } from '@/stores';

const StyledPlaceholder = styled('div')(({ theme }) => ({
    position: 'absolute',
    zIndex: '20',
    pointerEvents: 'none',
    userSelect: 'none',
    backgroundColor: theme.palette.primary.main,
}));

/**
 * Calculate the size of the place holder
 * @param placeholderAction - action to track
 * @param placeholderSize - size of the tracked widget
 * @returns bounding box of the placeholder
 */
function getPlaceholderStyle(
    placeholderAction: DesignerStoreInterface['drag']['placeholderAction'],
    placeholderSize: DesignerStoreInterface['drag']['placeholderSize'],
) {
    const spacer = 3;

    if (!placeholderAction || !placeholderSize) {
        return {
            display: 'none',
        };
    }

    const { type } = placeholderAction;

    // calculate the relative size
    if (type === 'before') {
        return {
            top: `${placeholderSize.top - spacer / 2}px`,
            left: `${placeholderSize.left}px`,
            height: `${spacer}px`,
            width: `${placeholderSize.width}px`,
            opacity: 1,
        };
    } else if (type === 'after') {
        return {
            top: `${
                placeholderSize.top + placeholderSize.height - spacer / 2
            }px`,
            left: `${placeholderSize.left}px`,
            height: `${spacer}px`,
            width: `${placeholderSize.width}px`,
            opacity: 1,
        };
    } else if (type === 'replace') {
        return {
            top: `${placeholderSize.top}px`,
            left: `${placeholderSize.left}px`,
            height: `${placeholderSize.height}px`,
            width: `${placeholderSize.width}px`,
            opacity: 0.3,
        };
    }

    return {};
}

/**
 * Rendered Placeholder for the view
 */
export const DesignerPlaceholder = observer(() => {
    // get the store
    const { designer } = useDesigner();

    // get the placeholder information
    if (!designer.drag.placeholderAction || !designer.drag.placeholderSize) {
        return <></>;
    }

    return (
        <StyledPlaceholder
            style={{
                ...getPlaceholderStyle(
                    designer.drag.placeholderAction,
                    designer.drag.placeholderSize,
                ),
            }}
        ></StyledPlaceholder>
    );
});
