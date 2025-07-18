import { ChangeEvent, useEffect, useMemo } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Controller, useForm } from 'react-hook-form';

import {
    styled,
    Stack,
    TextField,
    Modal,
    Button,
    Select,
    Typography,
} from '@semoss/ui';
import {
    ACTIONS_DISPLAY,
    ActionMessages,
    BlockDef,
    ListenerActions,
    useBlocks,
} from '@semoss/renderer';

import { useBlockSettings } from '@/hooks';

const StyledSpacer = styled('div')(() => ({
    flex: 1,
}));

interface ActionOverlayProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Sync or Async
     */
    type: 'sync' | 'async';

    /**
     * Lisetner to update
     */
    listener: Extract<keyof D['listeners'], string>;

    /**
     * Index of the action to update
     */
    actionIdx: number;

    /** Method called to close overlay  */
    onClose: () => void;
}

type ListenerActionForm = ListenerActions;

export const ListenerActionOverlay = observer(
    <D extends BlockDef = BlockDef>(props: ActionOverlayProps<D>) => {
        const {
            id,
            type,
            listener,
            actionIdx = -1,
            onClose = () => null,
        } = props;

        const { state } = useBlocks();
        const { listeners, setListener } = useBlockSettings(id);

        const destinationTypes = ['External', 'Internal'];
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

        // TODO: Refactor Code
        // Each listener have its own useForm
        const lis = listeners[listener].order[actionIdx];

        // create a new form
        const { control, handleSubmit, reset, watch, setValue } =
            useForm<ListenerActionForm>(
                lis
                    ? lis.message === ActionMessages.RUN_CELL
                        ? {
                              defaultValues: {
                                  message: ActionMessages.RUN_CELL,
                                  payload: {
                                      queryId: '',
                                      cellId: '',
                                  },
                              },
                          }
                        : lis.message === ActionMessages.DISPATCH_OPEN_EVENT
                        ? {
                              defaultValues: {
                                  message: ActionMessages.DISPATCH_OPEN_EVENT,
                                  payload: {
                                      destinationType: '',
                                      destination: '',
                                  },
                              },
                          }
                        : lis.message === ActionMessages.DISPATCH_EVENT
                        ? {
                              defaultValues: {
                                  message: ActionMessages.DISPATCH_EVENT,
                                  payload: {
                                      name: '',
                                      detail: {},
                                  },
                              },
                          }
                        : lis.message === ActionMessages.DISPATCH_OUTPUTS_EVENT
                        ? {
                              defaultValues: {
                                  message:
                                      ActionMessages.DISPATCH_OUTPUTS_EVENT,
                                  payload: {},
                              },
                          }
                        : {
                              defaultValues: {
                                  message: ActionMessages.RUN_QUERY,
                                  payload: {
                                      queryId: '',
                                  },
                              },
                          }
                    : {
                          defaultValues: {
                              message: ActionMessages.RUN_QUERY,
                              payload: {
                                  queryId: '',
                              },
                          },
                      },
            );

        // the type
        const message = watch('message');
        const distinationType = watch('payload.destinationType');

        const pages = useMemo(() => {
            return state.getAllBlocksOfType('page').map((page) => {
                return { id: page.id, route: page.data.route };
            });
        }, [distinationType]);

        // TODO: can we make each action type its own component.  So we don't have to do this
        const queryId = watch('payload.queryId');

        console.log(state.queries[queryId]);
        // get the queries as an array
        const cells = computed(() => {
            if (queryId) {
                const li = [];

                state.queries[queryId].list.forEach((iD) => {
                    li.push(state.queries[queryId].cells[iD]);
                });

                return li;

                return Object.values(state.queries[queryId].cells);
            }
            return [];
        }).get();

        /**
         * Allow user to submit the data
         */
        const onSubmit = handleSubmit((a: ListenerActionForm) => {
            const updated = listeners[listener].order
                ? [...listeners[listener].order]
                : [];

            if (actionIdx === -1) {
                // add the new one
                updated.push(a);

                // set it the listener
                setListener(listener, updated, type);
            } else {
                // add the new one
                updated[actionIdx] = a;

                // set it the listener
                setListener(listener, updated, type);
            }

            onClose();
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
                form = listeners[listener].order[actionIdx];
            }

            reset(form);
        }, [actionIdx]);

        // TODO: Refactor
        // reset whenever the message changes
        useEffect(() => {
            if (message === ActionMessages.RUN_QUERY) {
                if (listeners[listener].order[actionIdx]) {
                    if (
                        listeners[listener].order[actionIdx].message !==
                        ActionMessages.RUN_QUERY
                    ) {
                        setValue('payload', {
                            queryId: '',
                        });
                    }
                    setValue('message', ActionMessages.RUN_QUERY);
                }
            } else if (message === ActionMessages.DISPATCH_EVENT) {
                if (listeners[listener].order[actionIdx]) {
                    if (
                        listeners[listener].order[actionIdx].message !==
                        ActionMessages.DISPATCH_EVENT
                    ) {
                        setValue('payload', {
                            name: '',
                            detail: {},
                        });
                    }
                    setValue('message', ActionMessages.DISPATCH_EVENT);
                }
            } else if (message === ActionMessages.DISPATCH_OUTPUTS_EVENT) {
                setValue('payload', {});
            } else if (message === ActionMessages.RUN_CELL) {
                if (listeners[listener].order[actionIdx]) {
                    if (
                        listeners[listener].order[actionIdx].message !==
                        ActionMessages.RUN_CELL
                    ) {
                        setValue('payload', {
                            queryId: '',
                            cellId: '',
                        });
                    }
                    setValue('message', ActionMessages.RUN_CELL);
                }
            } else if (message === ActionMessages.DISPATCH_OPEN_EVENT) {
                if (listeners[listener].order[actionIdx]) {
                    if (
                        listeners[listener].order[actionIdx].message !==
                        ActionMessages.DISPATCH_OPEN_EVENT
                    ) {
                        setValue('payload', {
                            destinationType: '',
                            destination: '',
                        });
                    }
                    setValue('message', ActionMessages.DISPATCH_OPEN_EVENT);
                }
            }
        }, [message]);

        const queryIdValue = watch('payload.queryId');
        const cellIdValue = watch('payload.cellId');
        const nameValue = watch('payload.name');
        const destinationTypeValue = watch('payload.destinationType');
        const destinationValue = watch('payload.destination');

        // Validation logic for all ActionMessages
        const isSaveEnabled = (() => {
            switch (message) {
                case ActionMessages.RUN_QUERY:
                    return !!queryIdValue;
                case ActionMessages.RUN_CELL:
                    return !!queryIdValue && !!cellIdValue;
                case ActionMessages.DISPATCH_EVENT:
                    return !!nameValue;
                case ActionMessages.DISPATCH_OPEN_EVENT:
                    return !!destinationTypeValue && !!destinationValue;
                case ActionMessages.DISPATCH_OUTPUTS_EVENT:
                    return true; // No required fields
                default:
                    return false;
            }
        })();

        return (
            <>
                <Modal.Title>
                    {`${isNew ? 'Add' : 'Edit'} ${listener}`}
                </Modal.Title>
                <Modal.Content>
                    <Stack padding={2}>
                        <Controller
                            name={'message'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Select
                                        label="Type"
                                        value={field.value ? field.value : ''}
                                        onChange={(
                                            value: ChangeEvent<HTMLInputElement>,
                                        ) => {
                                            if (
                                                value.target.value ===
                                                ActionMessages.RUN_QUERY
                                            ) {
                                                setValue('payload', {
                                                    queryId: '',
                                                });
                                            } else if (
                                                value.target.value ===
                                                ActionMessages.RUN_CELL
                                            ) {
                                                setValue('payload', {
                                                    queryId: '',
                                                    cellId: '',
                                                });
                                            } else if (
                                                value.target.value ===
                                                ActionMessages.DISPATCH_EVENT
                                            ) {
                                                setValue('payload', {
                                                    name: '',
                                                    detail: {},
                                                });
                                            } else if (
                                                value.target.value ===
                                                ActionMessages.DISPATCH_OUTPUTS_EVENT
                                            ) {
                                                setValue('payload', {});
                                            } else if (
                                                value.target.value ===
                                                ActionMessages.DISPATCH_OPEN_EVENT
                                            ) {
                                                setValue('payload', {
                                                    destinationType: '',
                                                    destination: '',
                                                });
                                            }
                                            field.onChange(value);
                                        }}
                                    >
                                        {[
                                            ActionMessages.RUN_QUERY,
                                            ActionMessages.RUN_CELL,
                                            ActionMessages.DISPATCH_EVENT,
                                            ActionMessages.DISPATCH_OUTPUTS_EVENT,
                                            ActionMessages.DISPATCH_OPEN_EVENT,
                                        ].map((a, aIdx) => (
                                            <Select.Item key={aIdx} value={a}>
                                                {ACTIONS_DISPLAY[a]}
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
                                                        {q.id}
                                                    </Select.Item>
                                                ))}
                                            </Select>
                                        );
                                    }}
                                />
                            </>
                        ) : null}

                        {message === ActionMessages.RUN_CELL ? (
                            <>
                                <Controller
                                    name={'payload.queryId'}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Notebook"
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
                                                        {q.id}
                                                    </Select.Item>
                                                ))}
                                            </Select>
                                        );
                                    }}
                                />
                                <Controller
                                    name={'payload.cellId'}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Cell"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            >
                                                {cells.map((c) => {
                                                    const variableName =
                                                        state.getAlias(
                                                            queryId,
                                                            c.id,
                                                        );

                                                    return (
                                                        <Select.Item
                                                            key={c.id}
                                                            value={c.id}
                                                        >
                                                            <Typography
                                                                variant={
                                                                    'body2'
                                                                }
                                                            >
                                                                {variableName}
                                                            </Typography>
                                                        </Select.Item>
                                                    );
                                                })}
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
                                {/* TODO: data structure to send with event  */}
                                {/* <Controller
                                    name={"payload.detail"}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Data"
                                                helperText={"Need to make this a JSON Editor"}
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ""
                                                }
                                                onChange={(value) =>
                                                    field.onChange(JSON.stringify({
                                                        data: value
                                                    }))
                                                }
                                            />
                                        );
                                    }}
                                /> */}
                            </>
                        ) : null}

                        {message === ActionMessages.DISPATCH_OPEN_EVENT ? (
                            <>
                                <Controller
                                    name={'payload.destinationType'}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Destination"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) => {
                                                    setValue(
                                                        'payload.destination',
                                                        '',
                                                    );
                                                    field.onChange(value);
                                                }}
                                            >
                                                {destinationTypes.map(
                                                    (q, i) => (
                                                        <Select.Item
                                                            key={q + i + '--id'}
                                                            value={q}
                                                        >
                                                            {q}
                                                        </Select.Item>
                                                    ),
                                                )}
                                            </Select>
                                        );
                                    }}
                                />
                                {distinationType && (
                                    <Controller
                                        name={'payload.destination'}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <>
                                                    {distinationType ===
                                                    'External' ? (
                                                        <TextField
                                                            label="URL"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <Select
                                                            label="Page"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            {pages.map(
                                                                (q, i) => (
                                                                    <Select.Item
                                                                        key={
                                                                            q.id +
                                                                            i +
                                                                            '--id'
                                                                        }
                                                                        value={
                                                                            q.route
                                                                        }
                                                                    >
                                                                        {
                                                                            q.route as string
                                                                        }
                                                                    </Select.Item>
                                                                ),
                                                            )}
                                                        </Select>
                                                    )}
                                                </>
                                            );
                                        }}
                                    />
                                )}
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
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit()}
                        disabled={!isSaveEnabled}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </>
        );
    },
);
