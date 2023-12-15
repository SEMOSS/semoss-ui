import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

/**
 * WorkspaceOverlay can update the overlay in the workspace
 */
export const WorkspaceOverlay = observer((): JSX.Element => {
    const { workspace } = useWorkspace();

    return (
        <Modal
            fullWidth={true}
            maxWidth={'md'}
            open={workspace.overlay.open}
            onClose={() => {
                workspace.closeOverlay();
            }}
        >
            {workspace.overlay.content ? workspace.overlay.content() : null}
        </Modal>
    );
});
