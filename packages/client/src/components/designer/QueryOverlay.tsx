import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    TextField,
    Modal,
    Button,
    Typography,
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';

import { useBlocks, useDesigner } from '@/hooks';
import { ActionMessages } from '@/stores';

const StyledEditor = styled(Editor)(({ theme }) => ({
    borderWidth: '1px',
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
}));

const StyledSpacer = styled('div')(() => ({
    flex: 1,
}));

type EditQueryForm = {
    ID: string;
    QUERY: string;
};

interface QueryOverlayProps {
    /** id to open in the overlay. If not defined, it will create a new one. */
    id?: string;
}

/**
 * Edit or create a new query
 */
export const QueryOverlay = observer(
    (props: QueryOverlayProps): JSX.Element => {
        const { id = '' } = props;

        const { state } = useBlocks();
        const { designer } = useDesigner();

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
                QUERY: '',
            },
        });

        // reset the form qhen the query changes
        useEffect(() => {
            const values = {
                ID: '',
                QUERY: '',
            };

            // only get the query if the id is present
            if (id) {
                const q = state.getQuery(id);

                values.ID = q.id;
                values.QUERY = q.query;
            }

            reset(values);
        }, [id]);

        /**
         * Allow the user to login
         */
        const onSubmit = handleSubmit((data: EditQueryForm) => {
            clearErrors();
            if (!data.ID || !data.QUERY) {
                setError(`${!data.ID ? 'ID' : 'QUERY'}`, {
                    type: 'manual',
                    message: `Query${!data.ID ? ' ID' : ''} is required`,
                });
                return;
            }

            // validate the name if it is new
            if (isNew && (state.queries[data.ID] || state.blocks[data.ID])) {
                setError('ID', {
                    type: 'manual',
                    message: `Query with ID ${data.ID} already exists`,
                });
                return;
            }

            // dispatch a query
            state.dispatch({
                message: ActionMessages.SET_QUERY,
                payload: {
                    id: data.ID,
                    query: data.QUERY,
                },
            });

            // close the overlay
            designer.closeOverlay();
        });

        /**
         * Allow the user to login
         */
        const onDelete = () => {
            // dispatch a query
            state.dispatch({
                message: ActionMessages.DELETE_QUERY,
                payload: {
                    id: id,
                },
            });

            // close the overlay
            designer.closeOverlay();
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
                        <Controller
                            name={'QUERY'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <>
                                        <StyledEditor
                                            height="300px"
                                            defaultLanguage="plaintext"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) => {
                                                clearErrors();
                                                field.onChange(value);
                                            }}
                                        />
                                        {errors?.QUERY?.message ? (
                                            <Typography
                                                color="error"
                                                variant="caption"
                                            >
                                                {errors.QUERY.message}
                                            </Typography>
                                        ) : (
                                            <></>
                                        )}
                                    </>
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
                    <Button
                        variant="text"
                        onClick={() => designer.closeOverlay()}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={
                            !!errors?.ID?.message || !!errors?.QUERY?.message
                        }
                        onClick={() => onSubmit()}
                    >
                        Submit
                    </Button>
                </Modal.Actions>
            </>
        );
    },
);
