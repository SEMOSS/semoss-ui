import { Button, Modal, useNotification } from '@semoss/ui';
import { AxiosResponse } from 'axios';

import { ALL_TYPES } from '@/types';
import { useRootStore, useSettings } from '@/hooks';

import { SETTINGS_PROVISIONED_USER } from './settings.types';

interface MembersDeleteOverlayProps {
    /**
     * Type of engine
     */
    type: ALL_TYPES;

    /**
     * ID of the app or engine being edited
     */
    id: string;

    /**
     * Members
     */
    members: SETTINGS_PROVISIONED_USER[];

    /**
     * Track if the model is open or close
     */
    open: boolean;

    /**
     * Called on close
     *
     * @returns - method that is called onClose
     */
    onClose: (success: boolean) => void;
}

export const MembersDeleteOverlay = (props: MembersDeleteOverlayProps) => {
    const {
        type,
        id,
        members = [],
        open = false,
        onClose = () => null,
    } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    /**
     * @name deleteSelectedMembers
     * @param members - members that will be deleted
     *
     * delete the selected members from the app or engine
     */
    const deleteSelectedMembers = async (
        members: SETTINGS_PROVISIONED_USER[],
    ) => {
        let success = false;

        try {
            // construct requests for post data
            const requests = members.map((m) => {
                return m.id;
            });

            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.removeEngineUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            } else if (type === 'APP') {
                response = await monolithStore.removeProjectUserPermissions(
                    adminMode,
                    id,
                    requests,
                );
            }

            if (!response) {
                return;
            }

            // ignore if there is no response
            if (response.data.success) {
                notification.add({
                    color: 'success',
                    message: `Successfully removed ${
                        requests.length > 1 ? 'members' : 'member'
                    }`,
                });

                success = true;
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing user permissions`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // close the overlay
            onClose(success);
        }
    };

    return (
        <Modal open={open}>
            <Modal.Title>Are you sure?</Modal.Title>
            <Modal.Content>
                Would you like to delete all selected members
            </Modal.Content>
            <Modal.Actions>
                <Button variant="text" onClick={() => onClose(false)}>
                    Close
                </Button>
                <Button
                    variant={'contained'}
                    color="error"
                    onClick={() => {
                        deleteSelectedMembers(members);
                    }}
                >
                    Confirm
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
