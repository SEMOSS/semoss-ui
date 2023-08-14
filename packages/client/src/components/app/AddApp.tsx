import {
    Autocomplete,
    Button,
    TextField,
    Modal,
    FileDropzone,
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

export const AddApp = (props) => {
    const { open, onClose } = props;

    const { monolithStore } = useRootStore();

    const { handleSubmit, control } = useForm({
        defaultValues: {
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
            PROJECT_UPLOAD: null,
        },
    });

    const onSubmit = async (data) => {
        const projectMeta = {
            description: data.APP_DESCRIPTION,
            tag: data.TAGS,
        };

        const path = 'version/assets/';

        try {
            const response = await monolithStore.runQuery(
                `META | projectVar = CreateProject("${
                    data.APP_NAME
                }"); SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
                    projectMeta,
                )}])`,
            );

            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            const upload = await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                insightID,
                output.project_id,
                path,
            );

            await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                insightID,
                output.project_id,
                path,
            );

            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${
                    output.projectId
                }"])`,
            );
        } catch (e) {
            console.error(e);
        } finally {
            onClose();
        }
    };

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>Add App</Modal.Title>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                            return (
                                <FileDropzone
                                    value={field.value}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                    }}
                                />
                            );
                        }}
                    />
                </Modal.Content>
                <Modal.Actions>
                    <Button type="button">Cancel</Button>
                    <Button type="submit" variant={'contained'}>
                        Add New
                    </Button>
                </Modal.Actions>
            </form>
        </Modal>
    );
};
