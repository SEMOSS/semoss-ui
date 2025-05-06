import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Stack,
    TextField,
    Autocomplete,
    useNotification,
    styled,
    IconButton,
    Select,
    Box,
    Typography,
    CircularProgress,
    Tooltip,
} from '@semoss/ui';
import { useForm, Controller } from 'react-hook-form';
import { observer } from 'mobx-react-lite';

import { usePixel, useRootStore, useEngine } from '@/hooks';
import { MarkdownEditor } from '@/components/common';
import { toTitleCase } from '@/utility';
import {
    AutoAwesome,
    Cancel,
    CheckCircle,
    InfoOutlined,
} from '@mui/icons-material';

const StyledEditorContainer = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

const StyledModalHeader = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
});

interface EditEngineDetailsProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;

    /** Values to show in the fields */
    values: Record<string, unknown>;

    /** The engine data */
    engineData: Record<string, unknown>;
}

/**
 * Wrap the Engine routes and provide styling/functionality
 */
export const EditEngineDetails = observer((props: EditEngineDetailsProps) => {
    const {
        open = false,
        onClose = () => null,
        values = {},
        engineData = {},
    } = props;

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
    const { id, type, llmModels } = useEngine();

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, string[]>
    >(() => {
        return engineMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = [];

            return prev;
        }, {});
    });

    // selectedmodel to be used for text generation
    const [selectedModel, setSelectedModel] = useState<string>('');

    // show hide model selection
    const [canShowModels, setCanShowModels] = useState<boolean>(false);

    // track model generation state
    const [generateLoading, setGenerateLoading] = useState<boolean>(false);

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

    const { handleSubmit, control, setValue } = useForm<
        Record<string, unknown>
    >({
        defaultValues: values,
    });

    const generateUsingLLM = async (queryType: string) => {
        // generate the query based on the query type
        const query =
            queryType === 'markdown'
                ? `Create me some markdown in the 600 character range for my ${engineData.database_type} that is named ${engineData.database_name}`
                : `Create me a description in the 150 character range, for my ${engineData.database_type} that is named ${engineData.database_name}`;

        // query the LLM model
        const LLMresponse = await monolithStore.runQuery(
            `LLM(engine="${selectedModel}", command=["<encode>${query}</encode>"])`,
        );

        const { output: LLMOutput } = LLMresponse.pixelReturn[0];

        // update the value
        setValue(queryType, LLMOutput.response);
    };

    const handleGenerate = async () => {
        setGenerateLoading(true);
        // generate the markdown and description
        await generateUsingLLM('markdown');
        await generateUsingLLM('description');
        setGenerateLoading(false);
    };

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
            <Modal.Title>
                <StyledModalHeader>
                    <>Edit {toTitleCase(type)} Details</>
                    {!canShowModels && (
                        <Tooltip title="Generate">
                            <IconButton
                                onClick={() => setCanShowModels(!canShowModels)}
                                color="primary"
                                sx={{ marginLeft: 'auto' }}
                            >
                                <AutoAwesome />
                            </IconButton>
                        </Tooltip>
                    )}
                </StyledModalHeader>
            </Modal.Title>

            {canShowModels && (
                <Stack>
                    <Stack direction="row" paddingX={3} alignItems={'center'}>
                        <Select
                            size="small"
                            sx={{
                                width: '90%',
                                '.MuiInputBase-root': { borderRadius: '4px' },
                            }}
                            name="Select LLM"
                            id="llm"
                            variant="outlined"
                            label="Select LLM"
                            onChange={(e) => setSelectedModel(e.target.value)}
                            value={selectedModel}
                            disabled={generateLoading}
                        >
                            {llmModels.map((model) => {
                                return (
                                    <Select.Item
                                        value={model.app_id}
                                        key={model.app_id + '_modId'}
                                    >
                                        {model.app_name as string}
                                    </Select.Item>
                                );
                            })}
                        </Select>
                        <Tooltip title="Cancel">
                            <IconButton
                                onClick={() => {
                                    setCanShowModels(!canShowModels);
                                    setSelectedModel('');
                                }}
                                disabled={generateLoading}
                                sx={{ color: '#a9a9a9', padding: 0 }}
                            >
                                <Cancel sx={{ fontSize: '28px' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Apply">
                            <IconButton
                                onClick={handleGenerate}
                                disabled={!selectedModel}
                                color="primary"
                            >
                                {generateLoading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <CheckCircle sx={{ fontSize: '28px' }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Stack paddingX={3} direction="row" alignItems="flex-start">
                        <InfoOutlined color="error" sx={{ fontSize: '16px' }} />
                        <Typography
                            variant="body2"
                            sx={{ fontSize: '12px', color: 'red' }}
                        >
                            The existing content of the fields 'Markdown' and
                            'Description' will be replaced once you click
                            'Apply'.
                        </Typography>
                    </Stack>
                </Stack>
            )}
            <Modal.Content>
                <Stack spacing={3}>
                    {/* div included to prevent the first title from clipping */}
                    <div />
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
                            const isDescription = metakey === 'description';
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
                                                InputLabelProps={
                                                    isDescription
                                                        ? { shrink: true }
                                                        : undefined
                                                }
                                                placeholder={
                                                    isDescription
                                                        ? `Please provide a description for this ${type.toLocaleLowerCase()} to help others find it and understand how to use it.`
                                                        : undefined
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
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={label}
                                                        helperText={`Press enter to add ${metakey}`}
                                                    />
                                                )}
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
