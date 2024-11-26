import { observer } from 'mobx-react-lite';

import { Notebook } from '@/components/notebook';
import { Panel } from '@/components/workspace';

interface NotebookViewerPanelProps {
    /** Id of the notebook */
    id: string;
}

export const NotebookViewerPanel = observer(
    (props: NotebookViewerPanelProps) => {
        const { id } = props;

        return (
            <Panel>
                <Notebook id={id} />
            </Panel>
        );
    },
);
