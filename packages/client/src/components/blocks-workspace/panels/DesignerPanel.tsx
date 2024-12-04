import { observer } from 'mobx-react-lite';

import { Designer } from '@/components/designer';
import { Panel } from '@/components/workspace';

export const DesignerPanel = observer(() => {
    return (
        <Panel>
            <Designer />
        </Panel>
    );
});
