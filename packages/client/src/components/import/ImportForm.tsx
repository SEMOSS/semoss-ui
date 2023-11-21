import { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    FileDropzone,
    IconButton,
    Menu,
    TextField,
    Typography,
    Stack,
    Select,
    styled,
    useNotification,
    CircularProgress,
    Tooltip,
} from '@semoss/ui';
import { ExpandLess, ExpandMore, Help } from '@mui/icons-material';

import { useStepper, useRootStore } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm, Form, Controller } from 'react-hook-form';

const StyledFlexEnd = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
}));

const StyledProperty = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledKeyValue = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

const StyledDropzoneField = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
    height: '100%',
}));

const StyledSubmitButton = styled(Button)(() => ({
    textTransform: 'capitalize',
    minWidth: '128px',
}));

export const ImportForm = (props) => {
    const { submitFunc, fields } = props;

    const { steps, setSteps } = useStepper();
    const notification = useNotification();
    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();

    const [defaultFields, setDefaultFields] = useState([]);
    const [advancedFields, setAdvancedFields] = useState([]);
    const [openAdvanced, setOpenAdvanced] = useState(false);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            MODEL: '',
            // SMSS_PROPERTIES: [],
        } || { VECTOR: '' },
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        setInitialFieldState();
    }, [steps.length]);

    /**
     * 1. Set Default values for all fields, if default value is present
     * 2. Set options for fields that use pixel to show dropdown options
     * 3. If default value depends on another value that is present,
     * -- set a ref for that and listen for changes to that ref
     */
    const setInitialFieldState = async () => {
        const defaultVals = {};
        const defFields = [];
        const advFields = [];

        for (const f of fields) {
            const finalFieldState = f;
            defaultVals[finalFieldState.fieldName] =
                finalFieldState.defaultValue;

            if (finalFieldState.pixel || finalFieldState.options.pixel) {
                let pixelToExecute = '';

                if (finalFieldState.pixel) {
                    pixelToExecute += finalFieldState.pixel;
                }
                if (finalFieldState.options.pixel) {
                    pixelToExecute += finalFieldState.options.pixel;
                }

                const result = await monolithStore.runQuery(pixelToExecute);

                let output = result.pixelReturn[0].output,
                    operationType = result.pixelReturn[0].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                }

                if (finalFieldState.pixel && !finalFieldState.options.pixel) {
                    console.log('populate default value');
                    defaultVals[finalFieldState.fieldName] = output;
                } else if (
                    !finalFieldState.pixel &&
                    finalFieldState.options.pixel
                ) {
                    console.log('populate select options');
                    const opts = [];

                    output.forEach((opt) => {
                        opts.push({
                            display: opt.database_name,
                            value: opt.database_id,
                        });
                    });

                    finalFieldState.options = {
                        ...f.options,
                        options: opts,
                    };
                } else {
                    console.log('populate default value and select options');
                    defaultVals[finalFieldState.fieldName] = output;

                    output = result.pixelReturn[1].output;
                    operationType = result.pixelReturn[1].operationType;
                    const opts = [];

                    output.forEach((opt) => {
                        opts.push({
                            display: opt.database_name,
                            value: opt.database_id,
                        });
                    });

                    finalFieldState.options = {
                        ...f.options,
                        options: opts,
                    };
                }
            }

            if (finalFieldState.advanced) {
                advFields.push(finalFieldState);
            } else {
                defFields.push(finalFieldState);
            }
        }

        setDefaultFields(defFields);
        setAdvancedFields(advFields);

        reset(defaultVals);
    };

    /**
     * @desc Takes details from submission form and
     * constucts values to parent for submission
     * @param data
     * Refactor:  This should only handle the distribution of data
     * OnSubmit Function will handle Adding of Step or Pixel Call
     * Also: type this out
     */
    const onSubmit = async (data) => {
        setFormLoading(true);
        // If it's a File Upload
        if (steps[1].id.includes('File Uploads')) {
            if (steps[1].title === 'ZIP') {
                const upload = await monolithStore.uploadFile(
                    [data.ZIP],
                    configStore.store.insightID,
                );

                const pixelString =
                    steps[0].data === 'DATABASE'
                        ? `UploadDatabase(filePath=["${upload[0].fileLocation}"])`
                        : `UploadEngine(filePath=["${upload[0].fileLocation}"], engineTypes=["${steps[0].data}"])`;

                const response = await monolithStore.runQuery(pixelString);
                const output = response.pixelReturn[0].output,
                    operationType = response.pixelReturn[0].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    setFormLoading(false);
                    return;
                }

                navigate(`/engine/${(steps[0].data as string).toUpperCase()}`);
                return;
            }
            setFormLoading(false);
            return;
        }

        // If its one of the other engines that just has an input form and done
        if (steps[0].data === 'DATABASE') {
            // Add new step for connection details for metamodeling
            // 1. set another step for connection details, this will trigger a page change
            setSteps(
                [
                    ...steps,
                    {
                        title: data.NAME,
                        description:
                            'View and edit the relationships of the selected tables from the external connection that was made.',
                        data: data,
                    },
                ],
                steps.length + 1,
            );
        } else {
            const connectionDetails = {};
            const secondaryFields = {};

            fields.forEach((f) => {
                let fieldValue = data[f.fieldName];

                if (f.options.component === 'number') {
                    fieldValue = parseInt(fieldValue);
                }

                if (f.secondary) {
                    secondaryFields[f.fieldName] = fieldValue;
                } else {
                    connectionDetails[f.fieldName] = fieldValue;
                }
            });

            const formVals = {
                // 'MODEL' | "VECTOR" | "FUNCTION" | "STORAGE" | "DATABASE"
                type: steps[0].data,
                // Name of engine
                name: data.NAME,
                fields: connectionDetails,
                secondaryFields: secondaryFields,
            };

            submitFunc(formVals);
        }
        setFormLoading(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack rowGap={2}>
                {defaultFields.map((val, i) => {
                    if (!val.hidden) {
                        return (
                            <StyledKeyValue key={i}>
                                <Controller
                                    name={val.fieldName}
                                    control={control}
                                    rules={val.rules}
                                    render={({ field, fieldState }) => {
                                        const hasError = fieldState.error;
                                        if (
                                            val.options.component ===
                                            'text-field'
                                        ) {
                                            return (
                                                <TextField
                                                    fullWidth
                                                    required={
                                                        val.rules.required
                                                    }
                                                    label={val.label}
                                                    disabled={val.disabled}
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    // InputProps={{
                                                    //     startAdornment:
                                                    //         val.helperText ? (
                                                    //             <Tooltip
                                                    //                 title={
                                                    //                     val.helperText
                                                    //                 }
                                                    //             >
                                                    //                 <IconButton
                                                    //                     size={
                                                    //                         'small'
                                                    //                     }
                                                    //                 >
                                                    //                     <Help />
                                                    //                 </IconButton>
                                                    //             </Tooltip>
                                                    //         ) : null,
                                                    // }}
                                                    helperText={val.helperText}
                                                ></TextField>
                                            );
                                        } else if (
                                            val.options.component === 'password'
                                        ) {
                                            return (
                                                <TextField
                                                    type="password"
                                                    fullWidth
                                                    required={
                                                        val.rules.required
                                                    }
                                                    label={val.label}
                                                    disabled={val.disabled}
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    helperText={val.helperText}
                                                ></TextField>
                                            );
                                        } else if (
                                            val.options.component === 'select'
                                        ) {
                                            return (
                                                <Select
                                                    fullWidth
                                                    required={
                                                        val.rules.required
                                                    }
                                                    label={val.label}
                                                    disabled={val.disabled}
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    helperText={val.helperText}
                                                >
                                                    {val.options.options.map(
                                                        (opt, i) => {
                                                            return (
                                                                <Menu.Item
                                                                    key={i}
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {
                                                                        opt.display
                                                                    }
                                                                </Menu.Item>
                                                            );
                                                        },
                                                    )}
                                                </Select>
                                            );
                                        } else if (
                                            val.options.component === 'number'
                                        ) {
                                            return (
                                                <TextField
                                                    type="number"
                                                    fullWidth
                                                    required={
                                                        val.rules.required
                                                    }
                                                    label={val.label}
                                                    disabled={val.disabled}
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    helperText={val.helperText}
                                                ></TextField>
                                            );
                                        } else if (
                                            val.options.component ===
                                            'file-upload'
                                        ) {
                                            return (
                                                <StyledDropzoneField>
                                                    <Typography
                                                        variant={'body1'}
                                                    >
                                                        {val.label}
                                                    </Typography>
                                                    <FileDropzone
                                                        multiple={false}
                                                        value={field.value}
                                                        disabled={false}
                                                        onChange={(
                                                            newValues,
                                                        ) => {
                                                            field.onChange(
                                                                newValues,
                                                            );
                                                        }}
                                                    />
                                                </StyledDropzoneField>
                                            );
                                        }
                                    }}
                                />
                            </StyledKeyValue>
                        );
                    }
                })}

                {advancedFields.length ? (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography variant={'body1'}>
                                ADVANCED SETTINGS
                            </Typography>
                            <IconButton
                                onClick={() => setOpenAdvanced(!openAdvanced)}
                            >
                                {openAdvanced ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </div>

                        {openAdvanced &&
                            advancedFields.map((val, i) => {
                                if (!val.hidden) {
                                    return (
                                        <StyledKeyValue key={i}>
                                            <Controller
                                                name={val.fieldName}
                                                control={control}
                                                rules={val.rules}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => {
                                                    const hasError =
                                                        fieldState.error;
                                                    if (
                                                        val.options
                                                            .component ===
                                                        'text-field'
                                                    ) {
                                                        return (
                                                            <TextField
                                                                fullWidth
                                                                required={
                                                                    val.rules
                                                                        .required
                                                                }
                                                                label={
                                                                    val.label
                                                                }
                                                                disabled={
                                                                    val.disabled
                                                                }
                                                                value={
                                                                    field.value
                                                                        ? field.value
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    field.onChange(
                                                                        value,
                                                                    )
                                                                }
                                                                helperText={
                                                                    val.helperText
                                                                }
                                                            ></TextField>
                                                        );
                                                    } else if (
                                                        val.options
                                                            .component ===
                                                        'password'
                                                    ) {
                                                        return (
                                                            <TextField
                                                                type="password"
                                                                fullWidth
                                                                required={
                                                                    val.rules
                                                                        .required
                                                                }
                                                                label={
                                                                    val.label
                                                                }
                                                                disabled={
                                                                    val.disabled
                                                                }
                                                                value={
                                                                    field.value
                                                                        ? field.value
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    field.onChange(
                                                                        value,
                                                                    )
                                                                }
                                                                helperText={
                                                                    val.helperText
                                                                }
                                                            ></TextField>
                                                        );
                                                    } else if (
                                                        val.options
                                                            .component ===
                                                        'number'
                                                    ) {
                                                        return (
                                                            <TextField
                                                                type="number"
                                                                fullWidth
                                                                required={
                                                                    val.rules
                                                                        .required
                                                                }
                                                                label={
                                                                    val.label
                                                                }
                                                                disabled={
                                                                    val.disabled
                                                                }
                                                                value={
                                                                    field.value
                                                                        ? field.value
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    field.onChange(
                                                                        value,
                                                                    )
                                                                }
                                                                helperText={
                                                                    val.helperText
                                                                }
                                                            ></TextField>
                                                        );
                                                    } else if (
                                                        val.options
                                                            .component ===
                                                        'checkbox'
                                                    ) {
                                                        return (
                                                            <Checkbox
                                                                required={
                                                                    val.rules
                                                                        .required
                                                                }
                                                                label={
                                                                    val.label
                                                                }
                                                                disabled={
                                                                    val.disabled
                                                                }
                                                                checked={
                                                                    field.value
                                                                        ? field.value
                                                                        : false
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    field.onChange(
                                                                        value,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    } else if (
                                                        val.options
                                                            .component ===
                                                        'select'
                                                    ) {
                                                        return (
                                                            <Select
                                                                fullWidth
                                                                required={
                                                                    val.rules
                                                                        .required
                                                                }
                                                                label={
                                                                    val.label
                                                                }
                                                                disabled={
                                                                    val.disabled
                                                                }
                                                                value={
                                                                    field.value
                                                                        ? field.value
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
                                                                    field.onChange(
                                                                        value,
                                                                    )
                                                                }
                                                                helperText={
                                                                    val.helperText
                                                                }
                                                            >
                                                                {val.options.options.map(
                                                                    (
                                                                        opt,
                                                                        i,
                                                                    ) => {
                                                                        return (
                                                                            <Menu.Item
                                                                                key={
                                                                                    i
                                                                                }
                                                                                value={
                                                                                    opt.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    opt.display
                                                                                }
                                                                            </Menu.Item>
                                                                        );
                                                                    },
                                                                )}
                                                            </Select>
                                                        );
                                                    } else if (
                                                        val.options
                                                            .component ===
                                                        'zip-upload'
                                                    ) {
                                                        return (
                                                            <FileDropzone
                                                                multiple={false}
                                                                value={
                                                                    field.value
                                                                }
                                                                disabled={false}
                                                                onChange={(
                                                                    newValues,
                                                                ) => {
                                                                    field.onChange(
                                                                        newValues,
                                                                    );
                                                                }}
                                                            />
                                                        );
                                                    }
                                                }}
                                            />
                                        </StyledKeyValue>
                                    );
                                }
                            })}
                    </>
                ) : null}
                <StyledFlexEnd>
                    <StyledSubmitButton
                        disabled={formLoading}
                        type="submit"
                        variant="contained"
                    >
                        {formLoading ? (
                            <CircularProgress size="1.5em" />
                        ) : (
                            `Create ${steps[0].data.toLowerCase()}`
                        )}
                    </StyledSubmitButton>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
