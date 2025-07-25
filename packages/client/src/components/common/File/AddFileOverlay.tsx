import { useState } from 'react';
import {
    Button,
    Modal,
    FileDropzone,
    LinearProgress,
    Typography,
    Stack,
    Checkbox,
} from '@semoss/ui';
import { useRootStore } from '@/hooks';
import EngineIdsModal from '@/components/app/save-app/EngineIdsModal';

type EngineInfo = {
    name: string;
    files: string[];
    instances: (string | number)[];
};

interface AddFileOverlayProps {
    /** Type of file opened */
    type: 'app' | 'insight';

    /** Space where the file is located */
    space: string;

    /** Path where the file is being uploaded */
    uploadPath: string;

    /** Callback that is triggered onClose */
    onClose: (success: boolean, uploadPath: string) => void;
}

export const AddFileOverlay = (props: AddFileOverlayProps) => {
    const { type, space, uploadPath, onClose: onClose = () => null } = props;

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);
    const [uploadFile, setUploadFiles] = useState<File>(null);
    const [unzipFile, setUnzipFile] = useState<boolean>(false);
    const [showEngineIdsModal, setShowEngineIdsModal] = useState(false);
    const [successIds, setSuccessIds] = useState<string[]>([]);
    const [failedIds, setFailedIds] = useState<string[]>([]);
    const [pendingUploadPath, setPendingUploadPath] = useState<string | null>(null);
    const [isUploadProjectApp, setIsUploadProjectApp] = useState(false);
    const [engineInfo, setEngineInfo] = useState<Record<string, EngineInfo>>({});

    const handleEngineIdsModalClose = () => {
        setShowEngineIdsModal(false);
        if (pendingUploadPath) {
            onClose(true, pendingUploadPath);
            setPendingUploadPath(null);
        }
    };

    /**
     * Add the file to the app
     */
    const addFile = async () => {
        try {
            setIsLoading(true);

            let upload = null;
            if (type === 'app') {
                upload = await monolithStore.uploadFile(
                    [uploadFile],
                    configStore.store.insightID,
                    space,
                    uploadPath,
                );
            } else {
                throw new Error('TODO');
            }

            if (!upload) {
                throw new Error('Error missing uploading app');
            }

            const path = `${uploadPath}${upload[0].fileName}`;

            if (unzipFile) {
                if (type === 'app') {
                    await monolithStore.runQuery(
                        `UnzipFile(filePath=["${path}"], space=["${space}"])`,
                    );
                    const extractResult = await monolithStore.runQuery(
                        `ExtractAndSetDependencies(filePath=["version/assets"], space=["${space}"]);`
                    );
                    let extractOutput = extractResult.pixelReturn[0].output;
                    const success = extractOutput.engineIds.success ? Object.keys(extractOutput.engineIds.success) : [];
                    const failed = extractOutput.engineIds.failed ? Object.keys(extractOutput.engineIds.failed) : [];
                    setSuccessIds(success);
                    setFailedIds(failed);
                    const engineInfo: Record<string, EngineInfo> = {};
                    if (extractOutput.engineIds.success) {
                        Object.entries(extractOutput.engineIds.success).forEach(([id, obj]) => {
                            engineInfo[id] = {
                                name: (obj as { engineName?: string }).engineName || '',
                                files: (obj as any).files?.map((f: any) => f.filename) || [],
                                instances: (obj as any).files?.map((f: any) => f.instances) || [],
                            };
                        });
                    }
                    if (extractOutput.engineIds.failed) {
                        Object.entries(extractOutput.engineIds.failed).forEach(([id, obj]) => {
                            engineInfo[id] = {
                                name: (obj as { engineName?: string }).engineName || '',
                                files: (obj as any).files?.map((f: any) => f.filename) || [],
                                instances: (obj as any).files?.map((f: any) => f.instances) || [],
                            };
                        });
                    }
                    setEngineInfo(engineInfo);
                    setIsUploadProjectApp(false);
                    setPendingUploadPath(path);
                    setShowEngineIdsModal(true);
                    return;
                } else {
                    throw new Error('TODO');
                }
            }

            onClose(true, path);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);

            // reset state
            setUploadFiles(null);
            setUnzipFile(false);
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
                            setUploadFiles(newValue);
                        }}
                    />
                    <Checkbox
                        checked={unzipFile}
                        onChange={() => {
                            setUnzipFile(!unzipFile);
                        }}
                        label={<Typography variant="body2">Unzip?</Typography>}
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
            <EngineIdsModal
                open={showEngineIdsModal}
                successIds={successIds}
                failedIds={failedIds}
                onClose={handleEngineIdsModalClose}
                appId={space}
                isUploadProjectApp={isUploadProjectApp}
                engineInfo={engineInfo}
            />
        </>
    );
};