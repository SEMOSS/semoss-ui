import { observer } from 'mobx-react-lite';
import { Stack } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { ErrorBoundary } from '@/components/common';
import { Renderer } from '@/components/blocks';

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

    return (
        <ErrorBoundary title={'Something went wrong!'}>
            <Renderer id={id || designer.rendered} />
        </ErrorBoundary>
    );
});
