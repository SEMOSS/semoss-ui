import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { useNotebook } from '@/hooks';

/**
 * NotebookOverlay where a user can update content in their designer
 */
export const NotebookOverlay = observer((): JSX.Element => {
    const { notebook } = useNotebook();

    return (
        <Modal
            fullWidth={true}
            maxWidth={'md'}
            open={notebook.overlay.open}
            onClose={() => {
                notebook.closeOverlay();
            }}
        >
            {notebook.overlay.render ? notebook.overlay.render() : null}
        </Modal>
    );
});
