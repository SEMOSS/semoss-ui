import React, { useEffect, useState } from 'react';
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
} from '@semoss/ui';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { useImport, useRootStore } from '@/hooks';
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
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

export const ImportForm = (props) => {
    const { submitFunc, fields } = props;

    const { steps, setSteps } = useImport();
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

    /**
     * 1. Sets default values for all fields
     * 2. Set Default and Advanced Fields to loop
     */
    useEffect(() => {
        const defaultVals = {};
        const defFields = [];
        const advFields = [];

        fields.forEach((f) => {
            defaultVals[f.fieldName] = f.defaultValue;
            if (f.advanced) {
                advFields.push(f);
            } else {
                defFields.push(f);
            }
        });

        setDefaultFields(defFields);
        setAdvancedFields(advFields);

        reset(defaultVals);
    }, [steps.length]);

    /**
     * @desc Takes details from submission form and
     * constucts values to parent for submission
     * @param data // TO DO: Type this out and handle all of this in the parent
     */
    const onSubmit = async (data) => {
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
                    return;
                }

                navigate(`/catalog?type=${steps[0].data.toLowerCase()}`);
                return;
            }
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

            // Construct details for submission account for new properties
            Object.entries(data).forEach((obj) => {
                if (obj[0] !== 'SMSS_PROPERTIES') {
                    connectionDetails[obj[0]] = obj[1];
                }
            });
            /** For custom properties */
            // data.SMSS_PROPERTIES.forEach((obj) => {
            //     if (!connectionDetails[obj.KEY]) {
            //         connectionDetails[obj.KEY] = obj.VALUE;
            //     }
            // });

            const formVals = {
                type: steps[0].data, // 'MODEL' | "VECTOR" | "FUNCTION" | "STORAGE" | "DATABASE"
                name: data.NAME, // Name of engine
                fields: connectionDetails,
            };

            submitFunc(formVals);
        }
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
                                            val.options.component ===
                                            'zip-upload'
                                        ) {
                                            return (
                                                <FileDropzone
                                                    multiple={false}
                                                    value={field.value}
                                                    disabled={false}
                                                    onChange={(newValues) => {
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
                {/* {fields.map((property, i) => {
                    return (
                        <StyledProperty key={i}>
                            <StyledFlexEnd>
                                <IconButton
                                    onClick={() => {
                                        remove(i);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </StyledFlexEnd>
                            <StyledKeyValue>
                                <Controller
                                    name={`SMSS_PROPERTIES.${i}.KEY`}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState }) => {
                                        const hasError = fieldState.error;
                                        return (
                                            <TextField
                                                fullWidth
                                                required
                                                label="Key"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            ></TextField>
                                        );
                                    }}
                                />
                                <Controller
                                    name={`SMSS_PROPERTIES.${i}.VALUE`}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState }) => {
                                        const hasError = fieldState.error;
                                        return (
                                            <TextField
                                                fullWidth
                                                required
                                                label="Value"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            ></TextField>
                                        );
                                    }}
                                />
                            </StyledKeyValue>
                        </StyledProperty>
                    );
                })} */}
                <StyledFlexEnd>
                    {/* <Button
                        variant={'contained'}
                        onClick={() => {
                            append({
                                KEY: '',
                                VALUE: '',
                            });
                        }}
                    >
                        Add Property
                    </Button> */}
                    <Button type="submit" variant={'contained'}>
                        Add {steps[0].data.toLowerCase()}
                    </Button>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
