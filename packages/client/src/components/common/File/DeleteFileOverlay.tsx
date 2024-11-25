import { useState } from 'react';
import { Button, Modal, Typography } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { FileType } from './file.types';

interface DeleteFileOverlayProps {
    /** Type of file opened */
    type: FileType;

    /** Space where the file is located */
    space: string;

    /** Path of the deleted file */
    fileDeletePath: string;

    /** Callback that is triggered onClose */
    onClose: (success: boolean) => void;
}

export const DeleteFileOverlay = (props: DeleteFileOverlayProps) => {
    const { type, space, fileDeletePath = '', onClose = () => null } = props;

    const { monolithStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const fileName = fileDeletePath.split('/').pop();

    /**
     * Add the file to the app
     */
    const deleteFile = async () => {
        try {
            setIsLoading(true);

            let pixel = '';
            if (type === 'APP') {
                pixel = `DeleteAsset(filePath=["${fileDeletePath}"], space=["${space}"]);`;
            } else if (type === 'INSIGHT') {
                pixel = `DeleteAsset(filePath=["${fileDeletePath}"], space=[""]);`;
            } else if (type === 'STORAGE') {
                //TODO:
            }

            if (!pixel) {
                throw new Error('No Pixel');
            }

            await monolithStore.runQuery(pixel);

            onClose(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal.Title>Are you sure?</Modal.Title>
            <Modal.Content>
                <Typography variant="body2">
                    This will delete <b>{fileName}</b>
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
