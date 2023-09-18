import { observer } from 'mobx-react-lite';
import { Typography, styled } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { DesignerStoreInterface } from '@/stores';

const StyledGhost = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'fixed',
    zIndex: '20',
    height: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    pointerEvents: 'auto',
    userSelect: 'none',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    whiteSpace: 'nowrap',
}));

/**
 * Calculate the size of the ghost
 * @param ghostPosition - position of the tracked widget
 * @returns bounding box of the ghost
 */
function getGhostStyle(
    ghostPosition: DesignerStoreInterface['drag']['ghostPosition'],
) {
    const spacer = 3;

    if (!ghostPosition) {
        return {
            display: 'none',
        };
    }

    return {
        top: `${ghostPosition.y + spacer}px`,
        left: `${ghostPosition.x + spacer}px`,
    };
}

/**
 * Rendered Dragged Item
 */
export const Ghost = observer(() => {
    // get the store
    const { designer } = useDesigner();

    if (!designer.drag.ghostPosition) {
        return <></>;
    }

    return (
        <StyledGhost
            style={{
                ...getGhostStyle(designer.drag.ghostPosition),
            }}
        >
            <Typography variant={'body2'}>
                {designer.drag.ghostTitle}
            </Typography>
        </StyledGhost>
    );
});
