import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, TextField, Modal, Button } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlocks } from '@/hooks';
import { ActionMessages, NewCellAction } from '@/stores';
import { DefaultCells } from '../cell-defaults';

type NewCellForm = {
    ID: string;
};

interface NewCellOverlayProps {
    queryId: string;

    /**
     * Method called to close overlay
     * @param newCellId - new cell id if successful
     */
    onClose: (newCellId?: string) => void;

    previousCellId?: string;

    copyParameters?: boolean;
}

/**
 * Edit or create a new cell
 */
export const NewCellOverlay = observer(
    (props: NewCellOverlayProps): JSX.Element => {
        const {
            onClose = () => null,
            previousCellId = '',
            queryId,
            copyParameters = false,
        } = props;

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
        } = useForm<NewCellForm>({
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
        const onSubmit = handleSubmit((data: NewCellForm) => {
            clearErrors();
            if (!data.ID) {
                setError('ID', {
                    type: 'manual',
                    message: `Cell Id is required`,
                });
                return;
            }

            // validate that the name is new
            if (state.notebooks[queryId].cells[data.ID]) {
                setError('ID', {
                    type: 'manual',
                    message: `Cell Id ${data.ID} already exists`,
                });
                return;
            }

            let config: NewCellAction['payload']['config'] = {
                widget: DefaultCells['code'].widget,
                parameters: DefaultCells['code'].parameters,
            };

            if (previousCellId) {
                if (copyParameters) {
                    config = {
                        ...config,
                        parameters: {
                            ...state.notebooks[queryId].cells[previousCellId]
                                .parameters,
                        },
                    };
                } else if (
                    state.notebooks[queryId].cells[previousCellId].config
                        .widget === 'code'
                ) {
                    const previousCellType =
                        state.notebooks[queryId].cells[previousCellId]
                            .parameters?.type ?? 'pixel';
                    config = {
                        widget: DefaultCells['code'].widget,
                        parameters: {
                            ...DefaultCells['code'].parameters,
                            type: previousCellType,
                        },
                    };
                }
            }

            state.dispatch({
                message: ActionMessages.NEW_CELL,
                payload: {
                    queryId: queryId,
                    cellId: data.ID,
                    previousCellId: previousCellId,
                    config: config,
                },
            });

            // close the overlay
            onClose(data.ID);
        });

        return (
            <>
                <Modal.Title>
                    {copyParameters ? 'Copy' : 'New'} Cell
                </Modal.Title>
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
