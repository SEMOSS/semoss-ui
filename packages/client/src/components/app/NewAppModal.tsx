import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
    Button,
    TextField,
    Modal,
    LinearProgress,
    Stack,
    useNotification,
    TextArea,
    styled,
    Autocomplete,
} from '@semoss/ui';
import { SerializedState } from '@semoss/renderer';

import { useRootStore } from '@/hooks';
import { AppMetadata } from './app.types';

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)}!important`,
}));

type NewAppForm = {
    APP_NAME: string;
    APP_DESCRIPTION: string;
    APP_TAGS: string[];
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
            APP_DESCRIPTION: '',
            APP_TAGS: [],
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

                // after the project is created check for metadata. If true, run SetProjectMeta
                if (data['APP_TAGS'].length || data['APP_DESCRIPTION']) {
                    const setProjectMetadataResponse =
                        await monolithStore.runQuery(
                            `SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
                                {
                                    tag: data['APP_TAGS'],
                                    description: data['APP_DESCRIPTION'],
                                },
                            )}])`,
                        );

                    const output =
                        setProjectMetadataResponse.pixelReturn[0].output;
                    const operationType =
                        setProjectMetadataResponse.pixelReturn[0]
                            .operationType[0];

                    if (operationType.indexOf('ERROR') > -1) {
                        notification.add({
                            color: 'error',
                            message: output,
                        });

                        return;
                    }
                }
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

                let output = undefined;
                let operationType = undefined;

                output = response.pixelReturn[0].output;
                operationType = response.pixelReturn[0].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return false;
                }

                output = response.pixelReturn[1].output;
                operationType = response.pixelReturn[1].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                }

                // after the project is created check for metadata. If true, run SetProjectMeta
                if (data['APP_TAGS'].length || data['APP_DESCRIPTION']) {
                    const setProjectMetadataResponse =
                        await monolithStore.runQuery(
                            `SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
                                {
                                    tag: data['APP_TAGS'],
                                    description: data['APP_DESCRIPTION'],
                                },
                            )}])`,
                        );

                    output = setProjectMetadataResponse.pixelReturn[0].output;
                    operationType =
                        setProjectMetadataResponse.pixelReturn[0].operationType;

                    if (operationType.indexOf('ERROR') > -1) {
                        notification.add({
                            color: 'error',
                            message: output,
                        });
                    }
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
                <StyledModalContent>
                    <Stack direction="column" spacing={1}>
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
                                        inputProps={{
                                            'data-testid':
                                                'newAppModal-textField-name',
                                        }}
                                    />
                                );
                            }}
                        />
                        <Controller
                            name={'APP_DESCRIPTION'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field }) => {
                                return (
                                    <TextArea
                                        label="Description"
                                        variant="outlined"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        rows={3}
                                    />
                                );
                            }}
                        />
                        <Controller
                            name={'APP_TAGS'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <Autocomplete
                                        value={(field.value as string[]) || []}
                                        fullWidth
                                        multiple
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue);
                                        }}
                                        options={[]}
                                        freeSolo
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                placeholder='Press "Enter" to add tag'
                                            />
                                        )}
                                    />
                                );
                            }}
                        />
                    </Stack>
                </StyledModalContent>
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
