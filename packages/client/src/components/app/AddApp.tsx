import { useState } from 'react';
import {
    Autocomplete,
    Button,
    TextField,
    Modal,
    FileDropzone,
    LinearProgress,
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

type AddAppForm = {
    APP_NAME: string;
    APP_DESCRIPTION: string;
    TAGS: string[];
    PROJECT_UPLOAD: File;
};

interface AddAppProps {
    /** Track if the model is open */
    open: boolean;

    /** Callback that is triggered onClose */
    onClose: () => void;
}

export const AddApp = (props: AddAppProps) => {
    const { open, onClose } = props;

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const { handleSubmit, control } = useForm<AddAppForm>({
        defaultValues: {
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
            PROJECT_UPLOAD: null,
        },
    });

    /**
     * Method that is called to create the app
     */
    const createApp = handleSubmit(async (data: AddAppForm) => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // create the project
            const response = await monolithStore.runQuery(
                `META | projectVar = CreateProject("${
                    data.APP_NAME
                }"); SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
                    {
                        description: data.APP_DESCRIPTION,
                        tag: data.TAGS,
                    },
                )}])`,
            );

            const output = response.pixelReturn[0].output;

            // get the project id
            const projectId = output.project_id;

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
                projectId,
                path,
            );

            // upnzip the file in the new project
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${projectId}"])`,
            );

            // Load the insight classes
            await monolithStore.runQuery(
                `ReloadInsightClasses('${projectId}');`,
            );

            // set the project portal
            await monolithStore.setProjectPortal(
                false,
                projectId,
                true,
                'public',
            );

            // Publish the project the insight classes
            await monolithStore.runQuery(`PublishProject('${projectId}');`);

            // close it
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>Add App</Modal.Title>
            <form onSubmit={createApp}>
                <Modal.Content
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginTop: '8px',
                    }}
                >
                    <Controller
                        name={'APP_NAME'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <TextField
                                    required
                                    label="Name"
                                    value={field.value ? field.value : ''}
                                    disabled={isLoading}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                    <Controller
                        name={'APP_DESCRIPTION'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <TextField
                                    required
                                    label="Description"
                                    value={field.value ? field.value : ''}
                                    disabled={isLoading}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />

                    <Controller
                        name={'TAGS'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <Autocomplete<string, true, false, true>
                                    freeSolo={true}
                                    multiple={true}
                                    label={'Tags'}
                                    options={[]}
                                    value={(field.value as string[]) || []}
                                    disabled={isLoading}
                                    onChange={(event, newValue) => {
                                        field.onChange(newValue);
                                    }}
                                />
                            );
                        }}
                    />

                    <Controller
                        name={'PROJECT_UPLOAD'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            console.log(field.value);
                            return (
                                <FileDropzone
                                    multiple={false}
                                    value={field.value}
                                    disabled={isLoading}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                    }}
                                />
                            );
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
                        type="submit"
                        variant={'contained'}
                        disabled={isLoading}
                    >
                        Upload
                    </Button>
                </Modal.Actions>
            </form>
            {isLoading && <LinearProgress />}
        </Modal>
    );
};
