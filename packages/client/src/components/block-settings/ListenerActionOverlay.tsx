import { useEffect } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { styled, Stack, TextField, Modal, Button, Select } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlockSettings, useBlocks, useDesigner } from '@/hooks';
import { ActionMessages, BlockDef, ListenerActions } from '@/stores';

const StyledSpacer = styled('div')(() => ({
    flex: 1,
}));

interface ActionOverlayProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Lisetner to update
     */
    listener: Extract<keyof D['listeners'], string>;

    /**
     * Index of the action to update
     */
    actionIdx: number;
}

type ListenerActionForm = ListenerActions;

export const ListenerActionOverlay = observer(
    <D extends BlockDef = BlockDef>(props: ActionOverlayProps<D>) => {
        const { id, listener, actionIdx = -1 } = props;

        const { state } = useBlocks();
        const { listeners, setListener } = useBlockSettings(id);
        const { designer } = useDesigner();

        // get the queries as an array
        const queries = computed(() => {
            return Object.values(state.queries).sort((a, b) => {
                const aId = a.id.toLowerCase(),
                    bId = b.id.toLowerCase();

                if (aId < bId) {
                    return -1;
                }
                if (aId > bId) {
                    return 1;
                }
                return 0;
            });
        }).get();

        // track if it is a new query
        const isNew = actionIdx === -1;

        // create a new form
        const { control, handleSubmit, reset, watch, setValue } =
            useForm<ListenerActionForm>({
                defaultValues: {
                    message: ActionMessages.RUN_QUERY,
                    payload: {
                        queryId: '',
                    },
                },
            });

        // the type
        const message = watch('message');

        /**
         * Allow user to submit the data
         */
        const onSubmit = handleSubmit((a: ListenerActionForm) => {
            const updated = listeners[listener] ? [...listeners[listener]] : [];

            if (actionIdx === -1) {
                // add the new one
                updated.push(a);

                // set it the listener
                setListener(listener, updated);
            } else {
                // add the new one
                updated[actionIdx] = a;

                // set it the listener
                setListener(listener, updated);
            }

            designer.closeOverlay();
        });

        // reset the form qhen the query changes
        useEffect(() => {
            let form: ListenerActionForm = {
                message: ActionMessages.RUN_QUERY,
                payload: {
                    queryId: '',
                },
            };

            if (actionIdx !== -1) {
                form = listeners[listener][actionIdx];
            }

            reset(form);
        }, [actionIdx]);

        // reset whenever the message changes
        useEffect(() => {
            if (message === ActionMessages.RUN_QUERY) {
                setValue('payload', {
                    queryId: '',
                });
            } else if (message === ActionMessages.DISPATCH_EVENT) {
                setValue('payload', {
                    name: '',
                    detail: {},
                });
            }
        }, [message]);

        return (
            <>
                <Modal.Title>
                    {isNew
                        ? `Add Action to ${listener}`
                        : `Edit Action on ${listener}`}
                </Modal.Title>
                <Modal.Content>
                    <Stack>
                        <Controller
                            name={'message'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Select
                                        label="Type"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    >
                                        {[
                                            ActionMessages.RUN_QUERY,
                                            ActionMessages.DISPATCH_EVENT,
                                        ].map((a, aIdx) => (
                                            <Select.Item key={aIdx} value={a}>
                                                {a}
                                            </Select.Item>
                                        ))}
                                    </Select>
                                );
                            }}
                        />
                        {message === ActionMessages.RUN_QUERY ? (
                            <>
                                <Controller
                                    name={'payload.queryId'}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Query"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            >
                                                {queries.map((q) => (
                                                    <Select.Item
                                                        key={q.id}
                                                        value={q.id}
                                                    >
                                                        {q.name}
                                                    </Select.Item>
                                                ))}
                                            </Select>
                                        );
                                    }}
                                />
                            </>
                        ) : null}

                        {message === ActionMessages.DISPATCH_EVENT ? (
                            <>
                                <Controller
                                    name={'payload.name'}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            />
                                        );
                                    }}
                                />
                            </>
                        ) : null}
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <StyledSpacer />
                    <Button
                        type="button"
                        variant="text"
                        onClick={() => {
                            designer.closeOverlay();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit()}>Save</Button>
                </Modal.Actions>
            </>
        );
    },
);
