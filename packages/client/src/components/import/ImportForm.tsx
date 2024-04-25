// InputForm

import { useEffect, useState, useRef, useMemo, useReducer } from 'react';
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

const initialState = {
    defaultFields: [],
    advancedFields: [],
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

export const ImportForm = (props) => {
    const { submitFunc, fields } = props;

    const { steps, setSteps } = useStepper();
    const notification = useNotification();
    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { defaultFields, advancedFields } = state;
    const [openAdvanced, setOpenAdvanced] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [initScriptCallback, setInitScriptCallback] = useState(null);
    const [updateFieldName, setUpdateFieldName] = useState('');
    const [isDynamicInputChangedByUser, setIsDynamicInputChangedByUser] =
        useState(false);

    const watchedFieldRef = useRef({});

    const { control, handleSubmit, reset, watch, setValue, getValues } =
        useForm();

    /** Used to Trigger useEffect anytime these vals change */
    const fieldsToWatch = useMemo(() => {
        const f2w = [];
        for (const f of fields) {
            if (f.pixel) {
                const pixelParams = f.pixel.match(/<([^>]+)>/g);
                if (pixelParams) {
                    pixelParams.forEach((p) => {
                        const strippedVal = p.replace(/[<>]/g, '');
                        f2w.push(strippedVal);
                    });
                }
            }
            if (f.options.pixel) {
                const pixelParams = f.options.pixel.match(/<([^>]+)>/g);
                if (pixelParams) {
                    pixelParams.forEach((p) => {
                        const strippedVal = p.replace(/[<>]/g, '');
                        f2w.push(strippedVal);
                    });
                }
            }
        }
        return f2w;
    }, []);

    const dynamicFieldsToWatch = useMemo(() => {
        const f2w = [];
        for (const f of fields) {
            if (f.updateValueFieldsToWatch?.length) {
                f.updateValueFieldsToWatch.forEach((f) => {
                    f2w.push(f);
                });
            }
        }
        return f2w;
    }, []);

    /**
     * Set Form Fields State
     * 1. Set Default values with react hook form
     * 2. Splits out Advanced and Default fields
     */
    useEffect(() => {
        setInitialFieldState();
    }, [steps.length]);

    /**
     * Anytime a watched field changes trigger this
     * to call the reactor that dependsOn that field
     */
    useEffect(() => {
        console.warn('WATCHED FIELD CHANGED');
        const destructuredFieldRefs = Object.entries(watchedFieldRef.current);

        if (!destructuredFieldRefs.length) {
            setNewWatchedFieldReferences();
            return;
        } else {
            // 1. Loop through default fields
            defaultFields.forEach((f) => {
                checkFieldParamsAndExecutePixel(f);
            });

            // 2. Loop through advanced fields
            advancedFields.forEach((f) => {
                checkFieldParamsAndExecutePixel(f);
            });

            // 3. Set Reference of fields for next useEffect so we only call pixels that are affected
            setNewWatchedFieldReferences();
        }
    }, [...fieldsToWatch.map((field) => watch(field))]);

    /**
     * Anytime watched input fields defined in constants changes trigger this
     * Checks to see that update callback has been loaded
     * Creates params object with all watched input field names and current values
     * Passes params object to update callback from import.constants.ts
     * Removes whitespace from new init script string
     * Updates init script field value
     */
    useEffect(() => {
        if (!initScriptCallback) return;

        const mappedValuesObject = dynamicFieldsToWatch.reduce(
            (acc, fieldName) => ({ ...acc, [fieldName]: getValues(fieldName) }),
            {},
        );

        const newInitScript = initScriptCallback(mappedValuesObject);
        const newInitScriptSpacesTrimmed = newInitScript.replace(/\s+/g, ' ');
        setValue(updateFieldName, newInitScriptSpacesTrimmed);

        // additionally run this after update callback is initially loaded to populate script field
    }, [
        ...dynamicFieldsToWatch.map((field) => watch(field)),
        initScriptCallback,
    ]);

    /**
     * On init load of default values iterate and look for updateCallback
     * If it is present set it in useState var along with field name to be updated
     * May be combinable with another useEffect
     */
    useEffect(() => {
        defaultFields.forEach((val, i) => {
            if (val.updateCallback) {
                setUpdateFieldName(val.fieldName);
                setInitScriptCallback(
                    () =>
                        (...args) =>
                            val.updateCallback(...args),
                );
            }
        });
    }, [defaultFields]);

    /**
     * 1. Set Default values for all fields, if default value is present
     * 2. Field uses a pixel to populate default value,
     * - a. call that pixel if no dependent param vals are present in pixel
     * 3. Set options for fields that use pixel to show dropdown options
     */
    const setInitialFieldState = async () => {
        const defaultVals = {};
        const defFields = [];
        const advFields = [];

        for (const f of fields) {
            const finalFieldState = f;

            // 1. Set default vals for field
            defaultVals[finalFieldState.fieldName] =
                finalFieldState.defaultValue;

            if (finalFieldState.pixel || finalFieldState.options.pixel) {
                let pixelToExecute = '';

                // 2. Add to Pixel string for default value
                if (finalFieldState.pixel) {
                    const pixelParams =
                        finalFieldState.pixel.match(/<([^>]+)>/g);

                    // 2a. No dependent param vals for pixel
                    if (!pixelParams) {
                        pixelToExecute += finalFieldState.pixel;
                    } else {
                        if (finalFieldState.advanced) {
                            advFields.push(finalFieldState);
                        } else {
                            defFields.push(finalFieldState);
                        }
                        continue;
                    }
                }

                // 3. Add to Pixel String to get options for field dropdown
                if (finalFieldState.options.pixel) {
                    const pixelParams =
                        finalFieldState.options.pixel.match(/<([^>]+)>/g);
                    if (!pixelParams) {
                        pixelToExecute += finalFieldState.options.pixel;
                    } else {
                        if (finalFieldState.advanced) {
                            advFields.push(finalFieldState);
                        } else {
                            defFields.push(finalFieldState);
                        }
                        continue;
                    }
                }

                // If no pixel to execute
                if (!pixelToExecute) {
                    continue;
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
                    // Populating default value for field
                    defaultVals[finalFieldState.fieldName] = output;
                } else if (
                    !finalFieldState.pixel &&
                    finalFieldState.options.pixel
                ) {
                    // Populating dropdown options for field
                    const opts = [];
                    output.forEach((opt) => {
                        opts.push({
                            display:
                                opt[`${finalFieldState.options.optionDisplay}`],
                            value: opt[
                                `${finalFieldState.options.optionValue}`
                            ],
                        });
                    });

                    finalFieldState.options = {
                        ...f.options,
                        options: opts,
                    };
                } else {
                    // Populating default value and options for field
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

        dispatch({
            type: 'field',
            field: 'defaultFields',
            value: defFields,
        });

        dispatch({
            type: 'field',
            field: 'advancedFields',
            value: advFields,
        });

        reset(defaultVals);
    };

    const executeWatchedFieldPixel = async (
        fieldName,
        pixel: string,
        type: 'value' | 'options',
    ) => {
        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
            return;
        }

        if (type === 'value') {
            setValue(fieldName, output);
        } else {
            const output = [
                { display: 'ERROR: FORMAT OUTPUT VALUES', value: 'ERROR' },
            ];
            let defaultFieldIndex = -1;
            defaultFields.forEach((f, i) => {
                if (f.fieldName === fieldName) {
                    defaultFieldIndex = i;
                }
            });

            if (defaultFieldIndex > -1) {
                const copy = defaultFields;
                copy[defaultFieldIndex].options.options = output;

                dispatch({
                    type: 'field',
                    field: 'defaultFields',
                    value: copy,
                });
            }

            let advancedFieldIndex = -1;
            advancedFields.forEach((f, i) => {
                if (f.fieldName === fieldName) {
                    advancedFieldIndex = i;
                }
            });

            if (advancedFieldIndex > -1) {
                const copy = advancedFields;
                copy[advancedFieldIndex].options.options = output;

                dispatch({
                    type: 'field',
                    field: 'advancedFields',
                    value: copy,
                });
            }
        }
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

    /**
     * ---------------------------
     * Helpers -------------------
     * ---------------------------
     */

    /**
     * 1. if f.pixel or fields.options.pixel hold respective pixel as constant to execute where we replace param vals
     * 2. Loop through fieldsToWatch
     * -- 2a. if f.pixel.match(<'VALUE'>) replace it with form val
     * 3. if either of those pixels held as constant has no param blockers this means pixel can be executed
     * @param f
     */
    const checkFieldParamsAndExecutePixel = (f) => {
        let pixel = f.pixel;
        let optionsPixel = f.options.pixel;

        if (pixel) {
            if (hasParameterizedValue(pixel)) {
                let pixelParamChanged = false;
                fieldsToWatch.forEach((fieldName) => {
                    const val = watch(fieldName);
                    if (
                        watchedFieldRef.current[fieldName] !== undefined &&
                        val
                    ) {
                        // A watched value changed from what it was before
                        if (val !== watchedFieldRef.current[fieldName]) {
                            pixelParamChanged = true;
                        }
                        pixel = pixel.replaceAll(`<${fieldName}>`, val);
                    }
                });

                // Execute pixel if dependency changed and there aren't any params in string
                if (!hasParameterizedValue(pixel) && pixelParamChanged) {
                    executeWatchedFieldPixel(f.fieldName, pixel, 'value');
                }
            }
        }

        if (optionsPixel) {
            if (hasParameterizedValue(optionsPixel)) {
                let pixelParamChanged = false;
                fieldsToWatch.forEach((fieldName) => {
                    const val = watch(fieldName);
                    if (
                        watchedFieldRef.current[fieldName] !== undefined &&
                        val
                    ) {
                        // A watched value changed from what it was before
                        if (val !== watchedFieldRef.current[fieldName]) {
                            pixelParamChanged = true;
                        }
                        optionsPixel = optionsPixel.replaceAll(
                            `<${fieldName}>`,
                            val,
                        );
                    }
                });

                // Execute pixel if dependency changed and there aren't any params in string
                if (!hasParameterizedValue(optionsPixel) && pixelParamChanged) {
                    executeWatchedFieldPixel(
                        f.fieldName,
                        optionsPixel,
                        'options',
                    );
                }
            }
        }
    };

    /**
     * Sets new Reference Value of field
     */
    const setNewWatchedFieldReferences = () => {
        fieldsToWatch.forEach((fieldName) => {
            const val = watch(fieldName);

            watchedFieldRef.current[fieldName] = val;
        });
    };

    /**
     *
     * @param inputString
     * @returns
     */
    function hasParameterizedValue(inputString) {
        // Define a regular expression to match any value within "<>"
        const regex = /<([^>]+)>/;

        // Test if the input string matches the pattern
        return regex.test(inputString);
    }

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
                                                    id={`${val.fieldName}`}
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
                                                    id={`${val.fieldName}`}
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
                                                    id={`${val.fieldName}`}
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
                                                                id={`${val.fieldName}`}
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
                                                                id={`${val.fieldName}`}
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
                                                                id={`${val.fieldName}`}
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
