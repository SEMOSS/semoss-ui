import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { ErrorBoundary } from '@/components/common';
import { Renderer } from '@/components/blocks';

const StyledDiv = styled('div')(({ theme }) => ({
    height: '100%',
    position: 'relative',
}));

interface DesignerPanelProps {
    /** Id of the designer */
    id: string;
}

export const Designer = observer((props: DesignerPanelProps): JSX.Element => {
    const { designer } = useDesigner();
    const id = props.id;

    if (!designer) {
        return null;
    }

    /**
     * Handle the mouseleave on the page. This will deselect hovered widgets
     */
    const handleMouseLeave = (event: React.MouseEvent) => {
        designer.setHovered('');

        // reset the placeholder / clear the ghost if is its off the screen
        if (designer.drag.active) {
            designer.resetPlaceholder();
            designer.updateGhostPosition(null);
        }
    };

    return (
        <StyledDiv onMouseLeave={handleMouseLeave}>
            <ErrorBoundary title={'Something went wrong!'}>
                <Renderer id={id || designer.rendered} />
            </ErrorBoundary>
        </StyledDiv>
    );
});
