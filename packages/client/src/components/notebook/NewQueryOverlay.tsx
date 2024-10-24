import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, TextField, Modal, Button } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlocks } from '@/hooks';
import { ActionMessages } from '@/stores';

type NewQueryForm = {
    ID: string;
};

interface NewQueryOverlayProps {
    /**
     * Method called to close overlay
     * @param newQueryId - new query id if successful
     */
    onClose: (newQueryId?: string) => void;
}

/**
 * Edit or create a new query
 */
export const NewQueryOverlay = observer(
    (props: NewQueryOverlayProps): JSX.Element => {
        const { onClose = () => null } = props;

        const { state } = useBlocks();

        // create a new form
        const {
            getValues,
            watch,
            control,
            handleSubmit,
            clearErrors,
            setError,
            formState: { errors },
        } = useForm<NewQueryForm>({
            defaultValues: {
                ID: '',
            },
        });

        const watchAll = watch();

        const isFormValid = useMemo(() => {
            return !!getValues('ID');
        }, [watchAll]);

        /**
         * Allow the user to login
         */
        const onSubmit = handleSubmit((data: NewQueryForm) => {
            clearErrors();
            if (!data.ID) {
                setError('ID', {
                    type: 'manual',
                    message: `Query Id is required`,
                });
                return;
            }

            // validate the name if it is new
            if (state.notebooks[data.ID] || state.blocks[data.ID]) {
                setError('ID', {
                    type: 'manual',
                    message: `Query Id ${data.ID} already exists`,
                });
                return;
            }

            state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: {
                    queryId: data.ID,
                    config: {
                        cells: [
                            {
                                id: `${Math.floor(Math.random() * 100000)}`,
                                widget: 'code',
                                parameters: {
                                    code: '',
                                    type: 'py',
                                },
                            },
                        ],
                    },
                },
            });

            // close the overlay
            onClose(data.ID);
        });

        return (
            <>
                <Modal.Title>New Query</Modal.Title>
                <Modal.Content>
                    <Stack marginTop={1}>
                        <Controller
                            name={'ID'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        error={!!errors?.ID?.message}
                                        label="Id"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) => {
                                            clearErrors();
                                            field.onChange(value);
                                        }}
                                        helperText={errors?.ID?.message}
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
                        justifyContent="end"
                    >
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => onClose()}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!!errors?.ID?.message || !isFormValid}
                            onClick={() => onSubmit()}
                        >
                            Submit
                        </Button>
                    </Stack>
                </Modal.Actions>
            </>
        );
    },
);
