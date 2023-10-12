import React, { useEffect } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import {
    Button,
    IconButton,
    TextField,
    Stack,
    styled,
    Menu,
    Select,
    FileDropzone,
} from '@semoss/ui';
import { Delete } from '@mui/icons-material';
import { useImport } from '@/hooks';

import { MODEL_FORMS } from './forms.constants';

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

    const { steps, setSteps, CONNECTION_OPTIONS } = useImport();

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            MODEL: '',
            // SMSS_PROPERTIES: [],
        } || { VECTOR: '' },
    });

    /**
     * Sets default values for fields
     */
    useEffect(() => {
        const defaultVals = {};
        fields.forEach((f) => {
            defaultVals[f.fieldName] = f.defaultValue;
        });

        reset(defaultVals);
    }, [steps.length]);

    /**
     * @desc Takes details from submission form and
     * constucts values to parent for submission
     * @param data // TO DO: Type this out
     */
    const onSubmit = async (data) => {
        console.log('should have id', CONNECTION_OPTIONS);
        debugger;
        // Submit Form connection and its over. Now on catalog
        if (steps[0].data !== 'DATABASE') {
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
        } else {
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
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack rowGap={2}>
                {fields.map((val, i) => {
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
