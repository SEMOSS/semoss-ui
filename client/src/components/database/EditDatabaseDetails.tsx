import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Form,
    Grid,
    Typeahead,
    Textarea,
    useNotification,
} from '@semoss/components';
import { useForm, Controller } from 'react-hook-form';
import { observer } from 'mobx-react-lite';

import { usePixel, useRootStore, useDatabase } from '@/hooks';
import { MarkdownEditor } from '@/components/common';

interface EditDatabaseDetailsProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;

    /** Values to show in the fields */
    values: Record<string, unknown>;
}

/**
 * Wrap the Database routes and provide styling/functionality
 */
export const EditDatabaseDetails = observer(
    (props: EditDatabaseDetailsProps) => {
        const { open = false, onClose = () => null, values = {} } = props;

        // get the notification
        const notification = useNotification();

        // get the configStore
        const { configStore, monolithStore } = useRootStore();

        // get a list of the keys
        const databaseMetaKeys =
            configStore.store.config.databaseMetaKeys.filter((k) => {
                // filter the fields to the ones that are passed in
                return Object.prototype.hasOwnProperty.call(values, k.metakey);
            });

        // get the database information
        const { id } = useDatabase();

        // track the options
        const [filterOptions, setFilterOptions] = useState<
            Record<string, string[]>
        >(() => {
            return databaseMetaKeys.reduce((prev, current) => {
                prev[current.metakey] = [];

                return prev;
            }, {});
        });

        // get metakeys that we want to get the values from
        const metaKeys = databaseMetaKeys.map((k) => {
            return k.metakey;
        });

        // get the values
        const getDatabaseMetaValues = usePixel<
            {
                METAKEY: string;
                METAVALUE: string;
                count: number;
            }[]
        >(
            `META | GetDatabaseMetaValues ( metaKeys = ${JSON.stringify(
                metaKeys,
            )} ) ;`,
        );

        useEffect(() => {
            if (getDatabaseMetaValues.status !== 'SUCCESS') {
                return;
            }

            // format the catalog data into a map
            const updated = getDatabaseMetaValues.data.reduce(
                (prev, current) => {
                    if (!prev[current.METAKEY]) {
                        prev[current.METAKEY] = [];
                    }

                    prev[current.METAKEY].push(current.METAVALUE);

                    return prev;
                },
                {},
            );

            setFilterOptions(updated);
        }, [getDatabaseMetaValues.status, getDatabaseMetaValues.data]);

        const { handleSubmit, control } = useForm<Record<string, unknown>>({
            defaultValues: values,
        });

        /**
         * @name onSubmit
         * @desc approve, deny, delete selected members/users
         * @param data - form data
         */
        const onSubmit = handleSubmit((data) => {
            // copy over the defined keys
            const meta = {};
            for (const key in data) {
                if (data[key] !== undefined) {
                    meta[key] = data[key];
                }
            }

            if (Object.keys(meta).length === 0) {
                notification.add({
                    color: 'warning',
                    content: 'Nothing to Save',
                });

                return;
            }

            monolithStore
                .runQuery(
                    `SetDatabaseMetadata(database=["${id}"], meta=[${JSON.stringify(
                        meta,
                    )}], jsonCleanup=[true])`,
                )
                .then((response) => {
                    const { output, operationType } = response.pixelReturn[0];

                    // track the errors
                    if (operationType.indexOf('ERROR') > -1) {
                        notification.add({
                            color: 'error',
                            content: output,
                        });

                        return;
                    }

                    notification.add({
                        color: 'success',
                        content: output,
                    });

                    // close it and succesfully message
                    onClose(true);
                })
                .catch((error) => {
                    notification.add({
                        color: 'error',
                        content: error.message,
                    });
                });
        });

        return (
            <Modal
                open={open}
                onClose={() => {
                    onClose(false);
                }}
            >
                <Modal.Content size={'lg'}>
                    <Modal.Header>Edit Database Details</Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Grid>
                                {databaseMetaKeys.map((key) => {
                                    const { metakey, display_options } = key;

                                    const label =
                                        metakey.slice(0, 1).toUpperCase() +
                                        metakey.slice(1);

                                    if (display_options === 'markdown') {
                                        return (
                                            <Controller
                                                key={metakey}
                                                name={metakey}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Grid.Item>
                                                            <Form.Field
                                                                label={label}
                                                            >
                                                                <MarkdownEditor
                                                                    value={
                                                                        (field.value as string) ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        field.onChange(
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </Form.Field>
                                                        </Grid.Item>
                                                    );
                                                }}
                                            />
                                        );
                                    } else if (display_options === 'textarea') {
                                        return (
                                            <Controller
                                                key={metakey}
                                                name={metakey}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Grid.Item>
                                                            <Form.Field
                                                                label={label}
                                                            >
                                                                <Textarea
                                                                    value={
                                                                        (field.value as string) ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        field.onChange(
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </Form.Field>
                                                        </Grid.Item>
                                                    );
                                                }}
                                            />
                                        );
                                    } else if (
                                        display_options === 'single-typeahead'
                                    ) {
                                        return (
                                            <Controller
                                                key={metakey}
                                                name={metakey}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Grid.Item>
                                                            <Form.Field
                                                                label={label}
                                                            >
                                                                <Typeahead<
                                                                    string,
                                                                    false
                                                                >
                                                                    options={
                                                                        filterOptions[
                                                                            metakey
                                                                        ]
                                                                            ? filterOptions[
                                                                                  metakey
                                                                              ]
                                                                            : []
                                                                    }
                                                                    value={
                                                                        (field.value as string) ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        field.onChange(
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </Form.Field>
                                                        </Grid.Item>
                                                    );
                                                }}
                                            />
                                        );
                                    } else if (
                                        display_options === 'multi-typeahead'
                                    ) {
                                        return (
                                            <Controller
                                                key={metakey}
                                                name={metakey}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Grid.Item>
                                                            <Form.Field
                                                                label={label}
                                                            >
                                                                <Typeahead<
                                                                    string,
                                                                    true
                                                                >
                                                                    multiple={
                                                                        true
                                                                    }
                                                                    options={
                                                                        filterOptions[
                                                                            metakey
                                                                        ]
                                                                            ? filterOptions[
                                                                                  metakey
                                                                              ]
                                                                            : []
                                                                    }
                                                                    value={
                                                                        (field.value as string[]) ||
                                                                        []
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        field.onChange(
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </Form.Field>
                                                        </Grid.Item>
                                                    );
                                                }}
                                            />
                                        );
                                    }

                                    return null;
                                })}
                            </Grid>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="text"
                            onClick={() => {
                                // trigger the close
                                onClose(false);
                            }}
                        >
                            Close
                        </Button>
                        <Button onClick={() => onSubmit()}>Submit</Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        );
    },
);
