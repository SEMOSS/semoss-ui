import { useState } from 'react';
import {
    Autocomplete,
    Button,
    TextField,
    TextArea,
    Modal,
    FileDropzone,
    LinearProgress,
    Typography,
} from '@semoss/ui';
import { Controller } from 'react-hook-form';
import { useRootStore } from '@/hooks';
import { useNavigate } from 'react-router-dom';

interface AddAppAssetsProps {
    /** Track if the model is open */
    open: boolean;

    /** Application ID */
    appId: string;

    /** Callback that is triggered onClose */
    onClose: (appId?: string) => void;
}

export const AddAppAssetsModal = (props: AddAppAssetsProps) => {
    const { open, appId, onClose = () => {} } = props;
    const navigate = useNavigate();

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);
    const [uploadZipFile, setUploadZipFile] = useState<File>(null);

    /**
     * Method that is called to create the app
     */
    const uploadApp = async () => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // upload the file
            const upload = await monolithStore.uploadFile(
                [uploadZipFile],
                configStore.store.insightID,
                appId,
                path,
            );

            // upnzip the file in the new project
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${appId}"])`,
            );

            // Load the insight classes
            await monolithStore.runQuery(`ReloadInsightClasses('${appId}');`);

            // set the project portal
            await monolithStore.setProjectPortal(false, appId, true, 'public');

            // Publish the project the insight classes
            await monolithStore.runQuery(
                `PublishProject('${appId}', release=true);`,
            );

            // close it
            navigate(0);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            // turn of loading
            setUploadZipFile(null);
            setIsLoading(false);
        }
    };

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>Add App Assets</Modal.Title>
            <Modal.Content
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    marginTop: '8px',
                }}
            >
                <Typography variant="body1">
                    Upload a zip file of your app assets to display in the code
                    editor.
                </Typography>
                <Typography variant="caption">
                    Note that unsaved changes and files with matching paths will
                    be overridden.
                </Typography>
                <FileDropzone
                    multiple={false}
                    value={uploadZipFile}
                    disabled={isLoading}
                    onChange={(newValue: File) => {
                        setUploadZipFile(newValue);
                    }}
                />
            </Modal.Content>
            <Modal.Actions>
                <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onClose()}
                >
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    disabled={isLoading}
                    onClick={uploadApp}
                >
                    Upload
                </Button>
            </Modal.Actions>
            {isLoading && <LinearProgress />}
        </Modal>
    );
};
