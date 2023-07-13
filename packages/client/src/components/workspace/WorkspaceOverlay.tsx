import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

export const WorkspaceOverlay = observer(() => {
    const { workspace } = useWorkspace();

    // get the overlay
    const { overlay } = workspace;

    // don't render anything if there is not content
    if (!overlay.content) {
        return null;
    }

    return (
        <Modal
            maxWidth={'90vw'}
            open={overlay.open}
            onClose={() => {
                workspace.closeOverlay();
            }}
        >
            <Modal.Content>
                {overlay.content ? overlay.content({}) : null}
            </Modal.Content>
        </Modal>
    );
});
