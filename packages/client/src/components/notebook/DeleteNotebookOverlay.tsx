import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Modal, Button, Typography } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { ActionMessages } from '@/stores';

interface DeleteNotebookOverlayProps {
    /** id of the deleted notebok */
    deletedNotebookId: string;

    /**
     * Method called to close overlay
     * @param success - true if successful
     */
    onClose: (success: boolean) => void;
}

/**
 * Delete a query
 */
export const DeleteNotebookOverlay = observer(
    (props: DeleteNotebookOverlayProps): JSX.Element => {
        const { deletedNotebookId, onClose = () => null } = props;

        const { state } = useBlocks();

        const [isLoading, setIsLoading] = useState(false);

        /**
         * Add the file to the app
         */
        const deleteNotebook = async () => {
            try {
                setIsLoading(true);

                state.dispatch({
                    message: ActionMessages.DELETE_QUERY,
                    payload: {
                        queryId: deletedNotebookId,
                    },
                });

                onClose(true);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        const name = deletedNotebookId;

        return (
            <>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    <Typography variant="body2">
                        This will delete <b>{name}</b>
                    </Typography>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant={'outlined'}
                        onClick={() => {
                            onClose(false);
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        disabled={isLoading}
                        color={'error'}
                        variant={'contained'}
                        onClick={() => {
                            deleteNotebook();
                        }}
                    >
                        Delete
                    </Button>
                </Modal.Actions>
            </>
        );
    },
);
