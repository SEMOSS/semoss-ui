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
            open={overlay.open}
            onClose={() => {
                workspace.closeOverlay();
            }}
        >
            {overlay.content ? overlay.content({}) : null}
        </Modal>
    );
});
