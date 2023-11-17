import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, TextField, Modal, Button } from '@semoss/ui';
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
        const isNew = !!id;

        // create a new form
        const { control, reset, handleSubmit } = useForm<EditQueryForm>({
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
            if (!data.ID || !data.QUERY) {
                console.error('ERROR: ID and Query are required');
                return;
            }

            // validate the name if it is new
            if (isNew && (state.queries[data.ID] || state.blocks[data.ID])) {
                console.error(`ERROR: ${data.ID}} already exists`);
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
                    <Stack>
                        <Controller
                            name={'ID'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        label="Id"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    />
                                );
                            }}
                        />
                        <Controller
                            name={'QUERY'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <StyledEditor
                                        height="300px"
                                        defaultLanguage="plaintext"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    />
                                );
                            }}
                        />
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        type="button"
                        color={'error'}
                        onClick={() => onDelete()}
                    >
                        Delete
                    </Button>
                    <StyledSpacer />
                    <Button
                        variant="text"
                        onClick={() => designer.closeOverlay()}
                    >
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit()}>Submit</Button>
                </Modal.Actions>
            </>
        );
    },
);
