import { useEffect, useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import {
    Button,
    Select,
    Menu,
    IconButton,
    TextField,
    Stack,
    styled,
} from '@semoss/ui';
import { Delete } from '@mui/icons-material';
import { useImport } from '@/hooks';

import { STORAGE_FORMS } from './forms.constants';

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

type FormProps = {
    STORAGE_TYPE: string;
    SMSS_PROPERTIES: { KEY: string; value: string }[];
} & { [key: string]: unknown };

export const StorageForm = (props) => {
    const { submitFunc } = props;

    // Storage Name in last step
    const { steps } = useImport();

    const { control, handleSubmit, reset } = useForm<FormProps>({
        defaultValues: {
            STORAGE_TYPE: '',
            // SMSS_PROPERTIES: [],
        },
    });

    // const { fields, remove, append } = useFieldArray({
    //     control,
    //     name: 'SMSS_PROPERTIES',
    // });

    const lastStep = steps[steps.length - 1];

    const foundForm = STORAGE_FORMS.find((val) => {
        return val.name === lastStep.title;
    });

    if (!foundForm) return <div>No Form found</div>;

    /**
     * Sets default Values
     */
    useEffect(() => {
        const defaultVals = {};
        foundForm.fields.forEach((f) => {
            defaultVals[f.fieldName] = f.defaultValue;
        });

        reset(defaultVals);
    }, [steps.length]);

    const onSubmit = async (data) => {
        const smssProperties = {};

        Object.entries(data).forEach((obj) => {
            if (obj[0] !== 'SMSS_PROPERTIES') {
                smssProperties[obj[0]] = obj[1];
            }
        });

        // // Format the JSON to send back to submission in parent
        // data.SMSS_PROPERTIES.forEach((obj) => {
        //     if (!smssProperties[obj.KEY]) {
        //         smssProperties[obj.KEY] = obj.VALUE;
        //     }
        // });

        const formVals = {
            type: 'storage',
            storage: data.NAME,
            fields: smssProperties,
        };
        submitFunc(formVals);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack rowGap={2}>
                {foundForm.fields.map((val, i) => {
                    return (
                        <StyledKeyValue key={i}>
                            <Controller
                                name={val.fieldName}
                                control={control}
                                rules={val.rules}
                                render={({ field, fieldState }) => {
                                    const hasError = fieldState.error;
                                    if (
                                        val.options.component === 'text-field'
                                    ) {
                                        return (
                                            <TextField
                                                fullWidth
                                                required={val.rules.required}
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
                                                required={val.rules.required}
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
                                                required={val.rules.required}
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
                                                                {opt.display}
                                                            </Menu.Item>
                                                        );
                                                    },
                                                )}
                                            </Select>
                                        );
                                    }
                                }}
                            />
                        </StyledKeyValue>
                    );
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
                                    rules={{}}
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
                                    rules={{}}
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
                        Add Storage
                    </Button>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
