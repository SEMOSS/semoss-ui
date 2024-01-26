import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, TextField, Modal, Button } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlocks } from '@/hooks';
import {
    ActionMessages,
    CellDef,
    NewStepAction,
    StepStateConfig,
} from '@/stores';
import { DefaultCells } from '../cell-defaults';

type NewStepForm = {
    ID: string;
};

interface NewStepOverlayProps {
    queryId: string;

    /**
     * Method called to close overlay
     * @param newStepId - new step id if successful
     */
    onClose: (newStepId?: string) => void;

    previousStepId?: string;
}

/**
 * Edit or create a new step
 */
export const NewStepOverlay = observer(
    (props: NewStepOverlayProps): JSX.Element => {
        const { onClose = () => null, previousStepId = '', queryId } = props;

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
        } = useForm<NewStepForm>({
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
        const onSubmit = handleSubmit((data: NewStepForm) => {
            clearErrors();
            if (!data.ID) {
                setError('ID', {
                    type: 'manual',
                    message: `Step Id is required`,
                });
                return;
            }

            // validate that the name is new
            if (state.queries[queryId].steps[data.ID]) {
                setError('ID', {
                    type: 'manual',
                    message: `Step Id ${data.ID} already exists`,
                });
                return;
            }

            let config: NewStepAction['payload']['config'] = {
                widget: DefaultCells['code'].widget,
                parameters: DefaultCells['code'].parameters,
            };

            if (
                previousStepId &&
                state.queries[queryId].steps[previousStepId].cell.widget ===
                    'code'
            ) {
                const previousStepType =
                    state.queries[queryId].steps[previousStepId].parameters
                        ?.type ?? 'pixel';
                config = {
                    widget: DefaultCells['code'].widget,
                    parameters: {
                        ...DefaultCells['code'].parameters,
                        type: previousStepType,
                    },
                };
            }

            state.dispatch({
                message: ActionMessages.NEW_STEP,
                payload: {
                    queryId: queryId,
                    stepId: data.ID,
                    previousStepId: previousStepId,
                    config: config,
                },
            });

            // close the overlay
            onClose(data.ID);
        });

        return (
            <>
                <Modal.Title>New Step</Modal.Title>
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
                </Modal.Actions>
            </>
        );
    },
);
