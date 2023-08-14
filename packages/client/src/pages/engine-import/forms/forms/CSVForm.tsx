import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    TextField,
    Stack,
    FileDropzone,
    Select,
    Menu,
    Autocomplete,
} from '@semoss/ui';
import { ImportFormComponent } from './formTypes';
import { DataFormTable } from './../DataFormTable';
import { mdiNewspaperVariantMultipleOutline } from '@mdi/js';
import { Metamodel } from '@/components/metamodel';

export const CSVForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel, predictDataTypes } = props;

    const { control, getValues, handleSubmit, reset, setValue } = useForm();

    const values = getValues();

    const checkKeyDown = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const onSubmit = async (data) => {
        submitFunc(data);
    };

    React.useEffect(() => {
        reset({ ...values, DELIMETER: ',' });
    }, []);

    React.useEffect(() => {
        reset({
            ...values,
            DELIMETER: ',',
            DATABASE_TYPE: 'H2',
            METAMODEL_TYPE: 'As Suggested Metamodel',
        });
    }, [values.FILE]);

    metamodel ? console.log(metamodel) : null;

    return (
        <>
            {!predictDataTypes && !metamodel && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    onKeyDown={(e) => checkKeyDown(e)}
                >
                    <Stack rowGap={2}>
                        <Controller
                            name={'DATABASE_NAME'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        required
                                        label="Database Name"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'DATABASE_DESCRIPTION'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Database Description"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'DATABASE_TAGS'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <Autocomplete<string, true, false, true>
                                        fullWidth
                                        freeSolo
                                        options={[]}
                                        multiple
                                        label="Database Tags"
                                        value={
                                            field.value ? [...field.value] : []
                                        }
                                        onChange={(event, newValue) =>
                                            field.onChange(newValue)
                                        }
                                    />
                                );
                            }}
                        />
                        <Controller
                            name={'FILE'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <FileDropzone
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    />
                                );
                            }}
                        />
                        <Controller
                            name={'DELIMETER'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Delimeter"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'DATABASE_TYPE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <Select
                                        fullWidth
                                        label="Database Type"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    >
                                        <Menu.Item value={'H2'}>H2</Menu.Item>
                                        <Menu.Item value={'RDF'}>RDF</Menu.Item>
                                        <Menu.Item value={'Tinker'}>
                                            Tinker
                                        </Menu.Item>
                                        <Menu.Item value={'R'}>R</Menu.Item>
                                    </Select>
                                );
                            }}
                        />
                        <Controller
                            name={'METAMODEL_TYPE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <Select
                                        fullWidth
                                        label="Metamodel Type"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    >
                                        <Menu.Item value={'As Flat Table'}>
                                            As Flat Table
                                        </Menu.Item>
                                        <Menu.Item
                                            value={'As Suggested Metamodel'}
                                        >
                                            As Suggested Metamodel
                                        </Menu.Item>
                                        <Menu.Item value={'From Scratch'}>
                                            From Scratch
                                        </Menu.Item>
                                        <Menu.Item value={'From Prop File'}>
                                            From Prop File
                                        </Menu.Item>
                                    </Select>
                                );
                            }}
                        />
                        <Button type="submit">Submit</Button>
                    </Stack>
                </form>
            )}
            {predictDataTypes && (
                <DataFormTable predictDataTypes={predictDataTypes} />
            )}
            {metamodel && (
                <Metamodel onSelectNode={null} edges={[]} nodes={[]} />
            )}
        </>
    );
};

CSVForm.name2 = 'CSV';

CSVForm.logo = 'path_to_logo';
