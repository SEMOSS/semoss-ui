import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    TextField,
    Stack,
    Select,
    Menu,
    useNotification,
} from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { FileDropzone } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';
import { useRootStore } from '@/hooks';
import { DataFormTable } from '../DataFormTable';

export const ExcelForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel, predictDataTypes } = props;
    const { control, handleSubmit, watch, reset, getValues } = useForm();

    const [metamodelTypes, setMetamodelTypes] = React.useState([
        'As Flat Table',
        'Excel Loader Sheet Format',
    ]);

    const { monolithStore } = useRootStore();
    const values = getValues();
    const notification = useNotification();
    const navigate = useNavigate();

    const watchDelimeter = watch('DELIMETER');
    const watchDatabaseName = watch('DATABASE_NAME');
    const watchFile = watch('FILE');

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
            METAMODEL_TYPE: 'As Flat Table',
        });
    }, [values.FILE]);

    React.useEffect(() => {
        if (values.DATABASE_TYPE === 'H2') {
            setMetamodelTypes(['As Flat Table', 'Excel Loader Sheet Format']);
            reset({ ...values, METAMODEL_TYPE: 'As Flat Table' });
        }
        if (values.DATABASE_TYPE === 'RDF') {
            setMetamodelTypes(['Excel Loader Sheet Format']);
            reset({ ...values, METAMODEL_TYPE: 'Excel Loader Sheet Format' });
        }
    }, [values.DATABASE_TYPE]);

    /** data to be passed to into pixels dataTypeMap param */
    const excelDataTypesMap = useMemo(() => {
        const formattedNode = {};

        // TO-DO: fix TS errors on metamodel and node
        if (
            predictDataTypes &&
            !predictDataTypes.pixelReturn[0].output.dataTypes
        ) {
            console.log('prediect data type:', predictDataTypes);
            Object.entries(predictDataTypes.pixelReturn[0].output).forEach(
                (sheet) => {
                    // table = ['db name', {x: '', y: '' }]
                    const [sheetKey] = Object.keys(sheet[1]);
                    const node = {
                        [sheetKey]: sheet[1][sheetKey].dataTypes,
                    };
                    formattedNode[sheet[0]] = node;
                },
            );
        }

        return formattedNode;
    }, [predictDataTypes]);

    /** data to be passed into pixels additionalDataTypes param */
    const additionalDataTypes = React.useMemo(() => {
        const formattedNode = {};

        // TO-DO: fix TS errors on metamodel and node
        if (
            predictDataTypes &&
            !predictDataTypes.pixelReturn[0].output.dataTypes
        ) {
            Object.entries(predictDataTypes.pixelReturn[0].output).forEach(
                (sheet) => {
                    // table = ['db name', {x: '', y: '' }]
                    const [sheetKey] = Object.keys(sheet[1]);
                    const node = {
                        [sheetKey]: {},
                    };
                    Object.entries(sheet[1][sheetKey].dataTypes).forEach(
                        (val) => {
                            if (val[1] === 'TIMESTAMP') {
                                console.log('true value: ', val[0]);
                                node[sheetKey][val[0]] = 'dd\\-mm\\-yyyy';
                            }
                            formattedNode[sheet[0]] = node;
                        },
                    );
                },
            );
        }

        return formattedNode;
    }, [excelDataTypesMap]);

    const submitFlatTablePixel = async () => {
        const resp = await monolithStore.runQuery(
            `databaseVar = RdbmsUploadExcelData(database=["${watchDatabaseName}"], filePath=["${
                watchFile.name
            }"], delimiter=["${watchDelimeter}"], dataTypeMap=[${JSON.stringify(
                excelDataTypesMap,
            )}], newHeaders=[{}], additionalDataTypes=[${JSON.stringify(
                additionalDataTypes,
            )}], descriptionMap=[{}], logicalNamesMap=[{}], existing=[false])`,
        );

        const { operationType, output } = resp.pixelReturn[0];

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });

            return;
        } else {
            navigate(`/database/${output.database_id}`);
        }
    };

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
                                        required
                                        fullWidth
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
                                    <TextField
                                        fullWidth
                                        label="Database Tags"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
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
                                        disabled={true}
                                    >
                                        <Menu.Item value={'H2'}>H2</Menu.Item>
                                        <Menu.Item value={'RDF'}>RDF</Menu.Item>
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
                                        disabled={true}
                                    >
                                        {metamodelTypes.map((model, idx) => {
                                            return (
                                                <Menu.Item
                                                    key={idx}
                                                    value={model}
                                                >
                                                    {model}
                                                </Menu.Item>
                                            );
                                        })}
                                    </Select>
                                );
                            }}
                        />
                        <Button type="submit">Submit</Button>
                    </Stack>
                </form>
            )}
            {/* After the Form Submission */}
            {/* Workflow 1 */}
            {predictDataTypes && (
                <DataFormTable
                    predictDataTypes={predictDataTypes}
                    formValues={values}
                    submitFunc={submitFlatTablePixel}
                />
            )}
        </>
    );
};

ExcelForm.name2 = 'Excel';

ExcelForm.logo = 'path_to_logo';
