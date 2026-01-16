import { useState } from 'react';
import {
    Button,
    Modal,
    FileDropzone,
    LinearProgress,
    Typography,
    Stack,
} from '@semoss/ui';
import { useRootStore } from '@/hooks';
import { uploadFile } from "@/api";

interface EngineAddFileOverlayProps {
    type: 'engine';
    engine: string;
    uploadPath: string;
    onClose: (success: boolean, uploadPath: string) => void;
}

export const EngineAddFileOverlay = (props: EngineAddFileOverlayProps) => {
    const { type, engine, uploadPath, onClose: onClose = () => null } = props;

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);
    const [newUploadFile, setNewUploadFiles] = useState<File>(null);

    const addFile = async () => {
        try {
            setIsLoading(true);

            let upload = null;
            if (type === 'engine') {
                upload = await uploadFile(
                    [newUploadFile],
                    configStore.store.insightID,
                    null,
                    uploadPath,
                    engine,
                );
            } else {
                throw new Error('TODO');
            }

            if (!upload) {
                throw new Error('Error missing uploading engine');
            }

            const path = `${uploadPath}${upload[0].fileName}`;

            onClose(true, path);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setNewUploadFiles(null);
        }
    };

    return (
        <>
            <Modal.Title>Upload Files</Modal.Title>
            <Modal.Content>
                <Stack direction={'column'} spacing={2}>
                    <Typography variant="body2">
                        Upload files to <b>{uploadPath}</b>
                    </Typography>
                    <FileDropzone
                        multiple={false}
                        value={uploadFile}
                        disabled={isLoading}
                        onChange={(newValue: File) => {
                            setNewUploadFiles(newValue);
                        }}
                    />
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onClose(false, '')}
                >
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    disabled={isLoading}
                    onClick={() => addFile()}
                >
                    Upload
                </Button>
            </Modal.Actions>
            {isLoading && <LinearProgress />}
        </>
    );
};
