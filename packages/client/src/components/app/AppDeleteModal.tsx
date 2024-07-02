import { useEffect, useState } from 'react';
import { Button, useNotification, Modal } from '@semoss/ui';

import { useRootStore, usePixel, useSettings } from '@/hooks';

interface AppDeleteModalProps {
    isOpen: boolean;
    onClose(): void;
    appId: any;
    onDelete?: () => void;
}

export const AppDeleteModal = (props: AppDeleteModalProps) => {
    const { isOpen, onClose, appId, onDelete } = props;

    const { monolithStore, configStore } = useRootStore();

    const notification = useNotification();
    const [deleteModal, setDeleteModal] = useState(false);
    const [loading, setLoading] = useState(false);

    /**
     * Delete the item
     */
    const deleteApp = async () => {
        try {
            // start the loading screen
            setLoading(true);

            // run the pixel
            const response = await monolithStore.runQuery(
                `DeleteProject(project=['${appId}']);`,
            );

            const operationType = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully deleted`,
                });

                onDelete();
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // stop the loading screen
            setLoading(false);
            onClose();
        }
    };

    return (
        <Modal open={isOpen}>
            <Modal.Title>Are you sure?</Modal.Title>
            <Modal.Content>
                This action is irreversable. This will permanentely delete this
                app.
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button
                    color={'error'}
                    variant={'contained'}
                    onClick={() => deleteApp()}
                >
                    Delete
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
