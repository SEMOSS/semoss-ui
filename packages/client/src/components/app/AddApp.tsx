import React from 'react';
import {
    Autocomplete,
    Button,
    styled,
    Stack,
    TextField,
    Typography,
    Grid,
    Search,
    Modal,
    Card,
    IconButton,
    FileDropzone,
} from '@semoss/ui';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

export const AddApp = (props) => {
    const { open, onClose } = props;

    const { monolithStore } = useRootStore();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
            PROJECT_UPLOAD: null,
        },
    });

    /**
     * @name unzipFile
     * @param upload
     * @param path
     */
    function unzipFile(upload: any, path: string, projectId) {
        const pixel = `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${projectId}"])`;

        monolithStore.runQuery(pixel).then((response) => {
            console.log(response);
            // debugger
        });
    }

    const onSubmit = async (data) => {
        const projectMeta = {
            description: data.APP_DESCRIPTION,
            tag: data.TAGS,
        };

        const pixel = `META | projectVar = CreateProject("${
            data.APP_NAME
        }"); SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
            projectMeta,
        )}])`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            const path = 'version/assets/';

            monolithStore
                .uploadFile(
                    data.PROJECT_UPLOAD,
                    insightID,
                    output.project_id,
                    path,
                )
                .then(
                    async function (upload) {
                        await unzipFile(upload, path, output.project_id);
                    },
                    function (error) {
                        console.error(error);
                    },
                );
        });
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
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;

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
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;

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
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;

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
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;

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
