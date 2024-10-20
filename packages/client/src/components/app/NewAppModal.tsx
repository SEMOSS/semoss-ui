import { useMemo, useState } from 'react';
import {
    Button,
    TextField,
    Modal,
    LinearProgress,
    Stack,
    useNotification,
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
import { SerializedState } from '@/stores';
import { useRootStore } from '@/hooks';
import { AppMetadata } from './app.types';

type NewAppForm = {
    APP_NAME: string;
};

interface NewAppModalProps {
    /** Track if the model is open */
    open: boolean;

    /** Options to load the modal with */
    options: { type: 'blocks'; state: SerializedState } | { type: 'code' };

    /** Callback that is triggered onClose */
    onClose: (appId?: string) => void;
}

export const NewAppModal = (props: NewAppModalProps) => {
    const { open, options, onClose = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState(false);

    const { getValues, handleSubmit, control, watch } = useForm<NewAppForm>({
        defaultValues: {
            APP_NAME: '',
        },
    });

    const watchAll = watch();

    const isFormValid = useMemo(() => {
        return !!getValues('APP_NAME');
    }, [watchAll]);

    /**
     * Method that is called to create the app
     */
    const onSubmit = handleSubmit(async (data: NewAppForm) => {
        let appId = '';
        try {
            // start the loading screen
            setIsLoading(true);

            const { type } = options;
            if (type === 'blocks') {
                const { state } = options;

                // create the pixel
                if (!state) {
                    throw new Error(`State is missing from the blocks app`);
                }

                // create the project
                const { errors, pixelReturn } = await monolithStore.runQuery<
                    [AppMetadata]
                >(
                    `CreateAppFromBlocks ( project = [ "${
                        data.APP_NAME
                    }" ] , json =[${JSON.stringify(state)}]  ) ;`,
                );

                if (errors.length > 0) {
                    throw new Error(errors.join(','));
                }

                appId = pixelReturn[0].output.project_id;
            } else if (type === 'code') {
                // create the pixel
                const pixel = `CreateProject(project=["${data.APP_NAME}"], portal=[true], projectType=["CODE"]);`;

                // create the project
                const { errors, pixelReturn } = await monolithStore.runQuery<
                    [AppMetadata]
                >(pixel);

                if (errors.length > 0) {
                    throw new Error(errors.join(','));
                }

                appId = pixelReturn[0].output.project_id;

                // after the project is created run a pixel to create a new portals/index.html file
                // use the returned projectId

                const newIndexFilePath = 'version/assets/portals/index.html';
                const newIndexFileContent = `<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${data.APP_NAME}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

                const saveIndexFilePixel = `
                    SaveAsset(fileName=["${newIndexFilePath}"], content=["<encode>${newIndexFileContent}</encode>"], space=["${appId}"]); 
                    CommitAsset(filePath=["${newIndexFilePath}"], comment=["Hardcoded comment from the App Page editor"], space=["${appId}"])
                `;

                const response = await monolithStore.runQuery(
                    saveIndexFilePixel,
                );

                const output = response.pixelReturn[0].output,
                    operationType = response.pixelReturn[0].operationType,
                    outputTwo = response.pixelReturn[1].output,
                    operationTypeTwo = response.pixelReturn[1].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return false;
                }

                if (operationTypeTwo.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: outputTwo,
                    });
                }
            } else {
                return;
            }

            if (!appId) {
                throw new Error('Error creating app');
            }

            onClose(appId);
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // stop the loading screen
            setIsLoading(false);
        }
    });

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>New App</Modal.Title>
            <form onSubmit={onSubmit}>
                <Modal.Content>
                    <Stack direction="row" spacing={1}>
                        <Controller
                            name={'APP_NAME'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        label="Name"
                                        value={field.value ? field.value : ''}
                                        disabled={isLoading}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        fullWidth={true}
                                    />
                                );
                            }}
                        />
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Stack
                        direction="row"
                        spacing={1}
                        paddingX={2}
                        paddingBottom={2}
                    >
                        <Button
                            type="button"
                            disabled={isLoading}
                            onClick={() => onClose()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={isLoading || !isFormValid}
                        >
                            Create
                        </Button>
                    </Stack>
                </Modal.Actions>
            </form>
            {isLoading && <LinearProgress />}
        </Modal>
    );
};
