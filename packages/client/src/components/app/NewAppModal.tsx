import { useState } from 'react';
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
    options:
        | { type: 'blocks'; state: SerializedState }
        | { type: 'code' }
        | { type: 'prompt' };

    /** Callback that is triggered onClose */
    onClose: (appId?: string) => void;
}

export const NewAppModal = (props: NewAppModalProps) => {
    const { open, options, onClose = () => null } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState(false);

    const { handleSubmit, control } = useForm<NewAppForm>({
        defaultValues: {
            APP_NAME: '',
        },
    });

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
            } else if (type === 'prompt') {
                console.warn('TODO');
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
                                        required
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
                        Create
                    </Button>
                </Modal.Actions>
            </form>
            {isLoading && <LinearProgress />}
        </Modal>
    );
};
