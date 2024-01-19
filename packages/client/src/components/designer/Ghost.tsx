import { observer } from 'mobx-react-lite';
import { styled, Card } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { DesignerStoreInterface } from '@/stores';
import { getIconForBlock } from '../block-defaults';
import { BlocksMenuCardContent } from './BlocksMenuCardContent';

const StyledCard = styled(Card)(({ theme }) => ({
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: '8px',
    boxShadow: 'none',
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
    opacity: 0.5,
}));

const StyledGhost = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'fixed',
    zIndex: '20',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    //pointerEvents: 'auto',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    cursor: 'move',
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
            <StyledCard>
                <BlocksMenuCardContent
                    widget={designer.drag.ghostWidget}
                    icon={getIconForBlock(designer.drag.ghostWidget)}
                />
            </StyledCard>
        </StyledGhost>
    );
});
