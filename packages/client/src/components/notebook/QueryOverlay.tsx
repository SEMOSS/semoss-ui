import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, TextField, Modal, Button } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlocks } from '@/hooks';
import { ActionMessages } from '@/stores';

const StyledSpacer = styled('div')(() => ({
    flex: 1,
}));

type EditQueryForm = {
    ID: string;
};

interface QueryOverlayProps {
    /** id to open in the overlay. If not defined, it will create a new one. */
    id?: string;

    /** Method called to close overlay  */
    onClose: () => void;
}

/**
 * Edit or create a new query
 */
export const QueryOverlay = observer(
    (props: QueryOverlayProps): JSX.Element => {
        const { id = '', onClose = () => null } = props;

        const { state } = useBlocks();

        // track if it is a new query
        const isNew = !id;

        // create a new form
        const {
            control,
            reset,
            handleSubmit,
            clearErrors,
            setError,
            formState: { errors },
        } = useForm<EditQueryForm>({
            defaultValues: {
                ID: '',
            },
        });

        // reset the form qhen the query changes
        useEffect(() => {
            const values = {
                ID: '',
            };

            // only get the query if the id is present
            if (id) {
                const q = state.getQuery(id);

                values.ID = q.id;
            }

            reset(values);
        }, [id]);

        /**
         * Allow the user to login
         */
        const onSubmit = handleSubmit((data: EditQueryForm) => {
            clearErrors();
            if (!data.ID) {
                setError('ID', {
                    type: 'manual',
                    message: `Query ID is required`,
                });
                return;
            }

            // validate the name if it is new
            if (isNew && (state.queries[data.ID] || state.blocks[data.ID])) {
                setError('ID', {
                    type: 'manual',
                    message: `Query ID ${data.ID} already exists`,
                });
                return;
            }

            // dispatch a query
            if (isNew) {
                state.dispatch({
                    message: ActionMessages.NEW_QUERY,
                    payload: {
                        queryId: data.ID,
                        config: {
                            mode: 'manual',
                            steps: [],
                        },
                    },
                });
            } else {
                // TODO
            }

            // close the overlay
            onClose();
        });

        /**
         * Allow the user to login
         */
        const onDelete = () => {
            // dispatch a query
            state.dispatch({
                message: ActionMessages.DELETE_QUERY,
                payload: {
                    queryId: id,
                },
            });

            // close the overlay
            onClose();
        };

        return (
            <>
                <Modal.Title>{isNew ? 'New Query' : 'Edit Query'}</Modal.Title>
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
                    {isNew ? (
                        <></>
                    ) : (
                        <Button
                            type="button"
                            color="error"
                            onClick={() => onDelete()}
                        >
                            Delete
                        </Button>
                    )}
                    <StyledSpacer />
                    <Button variant="text" onClick={() => onClose()}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!!errors?.ID?.message}
                        onClick={() => onSubmit()}
                    >
                        Submit
                    </Button>
                </Modal.Actions>
            </>
        );
    },
);
