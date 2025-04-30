import { useEffect } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { styled, Stack, TextField, Modal, Button, Select } from "@semoss/ui";
import { Controller, useForm } from "react-hook-form";

import { useBlockSettings, useBlocks } from "../../hooks";
import {
    ACTIONS_DISPLAY,
    ActionMessages,
    BlockDef,
    ListenerActions,
} from "../../store";

const StyledSpacer = styled("div")(() => ({
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
    listener: Extract<keyof D["listeners"], string>;

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
        const { id, listener, actionIdx = -1, onClose = () => null } = props;

        const { state } = useBlocks();
        const { listeners, setListener } = useBlockSettings(id);

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
        const lis = listeners[listener][actionIdx];
        
        // create a new form
        const { control, handleSubmit, reset, watch, setValue } =
            useForm<ListenerActionForm>(
                lis
                    ? lis.message === ActionMessages.RUN_CELL ? {
                          defaultValues: {
                              message: ActionMessages.RUN_CELL,
                              payload: {
                                  queryId: "",
                                  cellId: "",
                              },
                          },
                      } : {
                        defaultValues: {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: "",
                            },
                        },
                    }
                    : {
                          defaultValues: {
                              message: ActionMessages.RUN_QUERY,
                              payload: {
                                  queryId: "",
                              },
                          },
                      },
            );

        // the type
        const message = watch("message");

        // TODO: can we make each action type its own component.  So we don't have to do this
        const queryId = watch("payload.queryId");

        // get the queries as an array
        const cells = computed(() => {
            if (queryId) {
                return Object.values(state.queries[queryId].cells).sort(
                    (a, b) => {
                        const aId = a.id.toLowerCase(),
                            bId = b.id.toLowerCase();

                        if (aId < bId) {
                            return -1;
                        }
                        if (aId > bId) {
                            return 1;
                        }
                        return 0;
                    },
                );
            }
            return [];
        }).get();

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

            onClose();
        });

        // reset the form qhen the query changes
        useEffect(() => {
            let form: ListenerActionForm = {
                message: ActionMessages.RUN_QUERY,
                payload: {
                    queryId: "",
                },
            };

            if (actionIdx !== -1) {
                form = listeners[listener][actionIdx];
            }

            reset(form);
        }, [actionIdx]);

        // TODO: Refactor
        // reset whenever the message changes
        useEffect(() => {
            if (message === ActionMessages.RUN_QUERY) {
                if (listeners[listener][actionIdx]) {
                    if (
                        listeners[listener][actionIdx].message !==
                        ActionMessages.RUN_QUERY
                    ) {
                        setValue("payload", {
                            queryId: "",
                        });
                    }
                    setValue("message", ActionMessages.RUN_QUERY);
                }
            } else if (message === ActionMessages.DISPATCH_EVENT) {
                setValue("payload", {
                    name: "",
                    detail: {},
                });
            } else if (message === ActionMessages.DISPATCH_OUTPUTS_EVENT) {
                setValue("payload", {});
            } else if (message === ActionMessages.RUN_CELL) {
                if (listeners[listener][actionIdx]) {
                    if (
                        listeners[listener][actionIdx].message !==
                        ActionMessages.RUN_CELL
                    ) {
                        setValue("payload", {
                            queryId: "",
                            cellId: "",
                        });
                    }
                    setValue("message", ActionMessages.RUN_CELL);
                }
            }
        }, [message]);

        return (
            <>
                <Modal.Title>
                    {`${isNew ? "Add" : "Edit"} ${listener}`}
                </Modal.Title>
                <Modal.Content>
                    <Stack padding={2}>
                        <Controller
                            name={"message"}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Select
                                        label="Type"
                                        value={field.value ? field.value : ""}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    >
                                        {[
                                            ActionMessages.RUN_QUERY,
                                            ActionMessages.RUN_CELL,
                                            ActionMessages.DISPATCH_EVENT,
                                            ActionMessages.DISPATCH_OUTPUTS_EVENT,
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
                                    name={"payload.queryId"}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Query"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ""
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
                                    name={"payload.queryId"}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Query"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ""
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
                                    name={"payload.cellId"}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Cell Id"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ""
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            >
                                                {cells.map((q) => (
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

                        {message === ActionMessages.DISPATCH_EVENT ? (
                            <>
                                <Controller
                                    name={"payload.name"}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ""
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
                    <Button onClick={() => onSubmit()}>Save</Button>
                </Modal.Actions>
            </>
        );
    },
);
