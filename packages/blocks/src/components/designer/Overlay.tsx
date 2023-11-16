import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { useDesigner } from '@/hooks';

/**
 * Overlay where a user can update content in their designer
 */
export const Overlay = observer((): JSX.Element => {
    const { designer } = useDesigner();

    return (
        <Modal
            fullWidth={true}
            maxWidth={'xl'}
            open={designer.overlay.open}
            onClose={() => {
                designer.closeOverlay();
            }}
        >
            {designer.overlay.render ? designer.overlay.render() : null}
        </Modal>
    );
});
