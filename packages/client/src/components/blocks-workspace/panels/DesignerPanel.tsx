import { observer } from 'mobx-react-lite';

import { Designer } from '@/components/designer';
import { Panel } from '@/components/workspace';

interface DesignerPanelProps {
    /** Id of the designer */
    id: string;
}

export const DesignerPanel = observer((props: DesignerPanelProps) => {
    const id = props.id;
    return (
        <Panel>
            <Designer id={id} />
        </Panel>
    );
});
