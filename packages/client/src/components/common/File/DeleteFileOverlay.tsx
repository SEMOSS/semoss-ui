import { useState } from 'react';
import { Button, Modal, Typography, useNotification } from '@semoss/ui';
import { useRootStore } from '@/hooks';

interface DeleteFileOverlayProps {
    /** Type of file opened */
    type: 'app' | 'insight';

    /** Space where the file is located */
    space: string;

    /** Path of the deleted file */
    // fileDeletePath: string;

    /** Array of file paths to be deleted(multiple files or single directory) */
    fileDeletePaths?: string[];

    /** Callback that is triggered onClose */
    onClose: (success: boolean) => void;

    /** Callback that is triggered onCancelDeleteMode */
    onCancelDeleteMode?: () => void;
}

export const DeleteFileOverlay = (props: DeleteFileOverlayProps) => {
    const {
        type,
        space,
        fileDeletePaths = [],
        onClose = () => null,
        onCancelDeleteMode,
    } = props;

    const { monolithStore } = useRootStore();

    const notification = useNotification();

    const [isLoading, setIsLoading] = useState(false);

    // const fileName = fileDeletePath.split('/').pop();

    /**
     * Add the file to the app
     */
    const deleteFile = async () => {
        try {
            setIsLoading(true);

            if (type === 'app') {
                const response = await monolithStore.runQuery(
                    // `DeleteAsset(filePath=["${fileDeletePath}"], space=["${space}"]);`,

                    // note: fileDeletePaths can be an array of paths to delete multiple files or single directory
                    // this is useful for deleting directory with multiple files inside
                    `DeleteAsset(filePath=[${fileDeletePaths
                        .map((p) => `"${p}"`)
                        .join(',')}], space=["${space}"]);`,
                );

                const pixelReturn = response.pixelReturn?.[0];
                const output = pixelReturn?.output;
                const type = pixelReturn?.operationType?.[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output || 'Delete failed',
                    });
                    return;
                }

                notification.add({
                    color: 'success',
                    message: output || 'Successfully deleted file',
                });
            } else if (type === 'insight') {
                throw new Error('TODO');
            }

            // If delete mode is active, cancel it after deletion
            if (onCancelDeleteMode) {
                onCancelDeleteMode();
            }
            onClose(true);
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: 'Delete failed!',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal.Title>Delete Selected Item?</Modal.Title>
            <Modal.Content>
                <Typography variant="body2">
                    you will permanently remove the item from your workspace.
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
                        deleteFile();
                    }}
                >
                    Delete
                </Button>
            </Modal.Actions>
        </>
    );
};
