import { useState } from 'react';
import {
    Button,
    Modal,
    LinearProgress,
    Typography,
    Stack,
    TextField,
} from '@semoss/ui';
import { useRootStore } from '@/hooks';

interface EngineCreateFileOverlayProps {
    type: 'engine';
    engine: string;
    mode: 'directory' | 'file';
    uploadPath: string;
    onClose: (success: boolean, uploadPath: string) => void;
}

export const EngineCreateFileOverlay = (
    props: EngineCreateFileOverlayProps,
) => {
    const { type, engine, mode, uploadPath, onClose = () => null } = props;

    const { monolithStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState<string>('');

    const createFile = async () => {
        try {
            setIsLoading(true);

            if (!name) {
                throw new Error('Name is required');
            }

            let pixel = '';
            let path = '';
            if (type === 'engine') {
                path = uploadPath;

                if (path.slice(-1) !== '/') {
                    path = `${path}/`;
                }

                path = `${path}${name}`;

                if (mode === 'file') {
                    pixel = `NewEngineAssetsFile(filePath=["${path}"], engine=["${engine}"]);`;
                } else if (mode === 'directory') {
                    if (path?.slice(-1) !== '/') {
                        path = `${path}/`;
                    }

                    pixel = `NewEngineAssetsDirectory(filePath=["${path}"], engine=["${engine}"]);`;
                }
            } else {
                throw new Error('TODO');
            }

            if (!pixel) {
                throw new Error('No Pixel defined');
            }

            const { errors } = await monolithStore.runQuery(pixel);
            if (errors.length > 0) {
                for (const e of errors) {
                    throw new Error(e);
                }
            }

            onClose(true, path);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setName('');
        }
    };

    return (
        <>
            <Modal.Title>
                Create {mode === 'file' ? 'File' : 'Folder'}
            </Modal.Title>
            <Modal.Content>
                <Stack direction={'column'} spacing={2}>
                    <Typography variant="body2">
                        Creating {mode === 'file' ? 'File' : 'Folder'} at{' '}
                        <b>{uploadPath}</b>
                    </Typography>
                    <TextField
                        label="Name"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                    disabled={isLoading || !name}
                    onClick={() => createFile()}
                >
                    Create
                </Button>
            </Modal.Actions>
            {isLoading && <LinearProgress />}
        </>
    );
};
