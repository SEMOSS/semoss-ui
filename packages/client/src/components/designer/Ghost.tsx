import { observer } from 'mobx-react-lite';
import { styled, Card, Stack, Typography } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { DesignerStoreInterface } from '@/stores';

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
    pointerEvents: 'auto',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    cursor: 'grabbing',
}));

const StyledStack = styled(Stack)(() => ({
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
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
        console.log('no ghost position in ghost');
        return <></>;
    }

    // console.log(designer.drag.ghostPosition)
    return (
        <StyledGhost
            style={{
                ...getGhostStyle(designer.drag.ghostPosition),
            }}
        >
            <StyledCard>
                <StyledStack direction="column" padding={1} spacing={1}>
                    <div>{designer.drag.ghostIcon ? 'hello' : 'image'}</div>
                    <StyledTypography variant="subtitle2">
                        {designer.drag.ghostDisplay}
                    </StyledTypography>
                </StyledStack>
            </StyledCard>
        </StyledGhost>
    );
});
