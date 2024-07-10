import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Stack,
    TextField,
    Autocomplete,
    useNotification,
    styled,
} from '@semoss/ui';
import { useForm, Controller } from 'react-hook-form';
import { observer } from 'mobx-react-lite';

import { usePixel, useRootStore, useEngine } from '@/hooks';
import { MarkdownEditor } from '@/components/common';
import { toTitleCase } from '@/utility';

const StyledEditorContainer = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

interface EditEngineDetailsProps {
    /** Type of Engine */
    type: string;

    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;

    /** Values to show in the fields */
    values: Record<string, unknown>;
}

/**
 * Wrap the Engine routes and provide styling/functionality
 */
export const EditEngineDetails = observer((props: EditEngineDetailsProps) => {
    const { open = false, type, onClose = () => null, values = {} } = props;

    // get the notification
    const notification = useNotification();

    // get the configStore
    const { configStore, monolithStore } = useRootStore();

    // get a list of the keys
    const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            // filter the fields to the ones that are passed in
            return Object.prototype.hasOwnProperty.call(values, k.metakey);
        },
    );

    // get the engine information
    const { id } = useEngine();

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, string[]>
    >(() => {
        return engineMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = [];

            return prev;
        }, {});
    });

    // get the values
    const getEngineMetaValues = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(`META | GetDatabaseMetaValues ( metaKeys = ['tags'] ) ;`);

    useEffect(() => {
        if (getEngineMetaValues.status !== 'SUCCESS') {
            return;
        }

        // format the catalog data into a map
        const updated = getEngineMetaValues.data.reduce((prev, current) => {
            if (!prev[current.METAKEY]) {
                prev[current.METAKEY] = [];
            }

            prev[current.METAKEY].push(current.METAVALUE);

            return prev;
        }, {});

        // add metakeys that don't get options from projects/engines but stored in config call
        const metaKeysWithOpts = engineMetaKeys.filter((k) => {
            return k.display_options === 'select-box';
        });

        metaKeysWithOpts.forEach((filter) => {
            if (filter.display_values) {
                const split = filter.display_values.split(',');
                const formatted = [];
                split.forEach((val) => {
                    formatted.push(val);
                });

                updated[filter.metakey] = formatted;
            }
        });

        setFilterOptions(updated);
    }, [getEngineMetaValues.status, getEngineMetaValues.data]);

    const { handleSubmit, control } = useForm<Record<string, unknown>>({
        defaultValues: values,
    });

    /**
     * @name onSubmit
     * @desc approve, deny, delete selected members/users
     * @param data - form data
     */
    const onSubmit = handleSubmit((data: object) => {
        // copy over the defined keys
        const meta = {};
        if (data) {
            for (const key in data) {
                if (data[key] !== undefined) {
                    meta[key] = data[key];
                }
            }
        }

        if (Object.keys(meta).length === 0) {
            notification.add({
                color: 'warning',
                message: 'Nothing to Save',
            });

            return;
        }

        monolithStore
            .runQuery(
                `SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(
                    meta,
                )}], jsonCleanup=[true])`,
            )
            .then((response) => {
                const { output, additionalOutput, operationType } =
                    response.pixelReturn[0];

                // track the errors
                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                }

                notification.add({
                    color: 'success',
                    message: additionalOutput[0].output,
                });

                // close it and succesfully message
                onClose(true);
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
    });

    return (
        <Modal
            open={open}
            maxWidth={'md'}
            onClose={() => {
                onClose(false);
            }}
        >
            <Modal.Title>Edit {toTitleCase(type)} Details</Modal.Title>
            <Modal.Content>
                <Stack spacing={4}>
                    {engineMetaKeys.map((key) => {
                        const { metakey, display_options } = key;
                        const label =
                            metakey.slice(0, 1).toUpperCase() +
                            metakey.slice(1);

                        if (display_options === 'markdown') {
                            return (
                                <StyledEditorContainer key={metakey}>
                                    <Controller
                                        name={metakey}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <MarkdownEditor
                                                    value={
                                                        (field.value as string) ||
                                                        ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                />
                                            );
                                        }}
                                    />
                                </StyledEditorContainer>
                            );
                        } else if (display_options === 'textarea') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={metakey}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                multiline
                                                minRows={3}
                                                maxRows={3}
                                                label={label}
                                                value={
                                                    (field.value as string) ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'single-typeahead') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={metakey}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Autocomplete<string, false>
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (field.value as string) ||
                                                    ''
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'multi-typeahead') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={metakey}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Autocomplete<
                                                string,
                                                true,
                                                false,
                                                true
                                            >
                                                freeSolo={true}
                                                multiple={true}
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (field.value as string[]) ||
                                                    []
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'select-box') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={metakey}
                                    control={control}
                                    render={({ field }) => {
                                        const formattedValue =
                                            typeof field.value === 'string'
                                                ? [field.value]
                                                : field.value;

                                        return (
                                            <Autocomplete<
                                                string,
                                                true,
                                                false,
                                                true
                                            >
                                                multiple={true}
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (formattedValue as string[]) ||
                                                    []
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        }

                        // return null;
                    })}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    variant="text"
                    onClick={() => {
                        // trigger the close
                        onClose(false);
                    }}
                >
                    Close
                </Button>
                <Button variant="contained" onClick={() => onSubmit()}>
                    Submit
                </Button>
            </Modal.Actions>
        </Modal>
    );
});
