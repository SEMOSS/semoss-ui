import { useState } from 'react';
import { Button, Modal, Typography } from '@semoss/ui';
import { useRootStore } from '@/hooks';

interface EngineDeleteFileOverlayProps {
    type: 'engine';
    engine: string;
    fileDeletePath: string;
    onClose: (success: boolean) => void;
}

export const EngineDeleteFileOverlay = (
    props: EngineDeleteFileOverlayProps,
) => {
    const { type, engine, fileDeletePath = '', onClose = () => null } = props;

    const { monolithStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const fileName = fileDeletePath.split('/').pop();

    const deleteFile = async () => {
        try {
            setIsLoading(true);

            if (type === 'engine') {
                await monolithStore.runQuery(
                    `DeleteEngineAssets(filePath=["${fileDeletePath}"], engine=["${engine}"]);`,
                );
            }

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
