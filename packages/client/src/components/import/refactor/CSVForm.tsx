import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    TextField,
    Stack,
    FileDropzone,
    Select,
    Menu,
    Autocomplete,
    useNotification,
} from '@/component-library';
import { useNavigate } from 'react-router-dom';
import { ImportFormComponent } from './formTypes';
import { DataFormTable } from './DataFormTable';
import { Metamodel } from '@/components/metamodel';
import { useRootStore } from '@/hooks';

export const CSVForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel, predictDataTypes } = props;
    const [metamodelTypes, setMetamodelTypes] = React.useState([
        'As Flat Table',
        'As Suggested Metamodel',
        'From Scratch',
        'From Prop File',
    ]);
    const { monolithStore } = useRootStore();

    const { control, getValues, handleSubmit, reset, watch } = useForm();

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
            METAMODEL_TYPE: 'As Suggested Metamodel',
        });
    }, [values.FILE]);

    React.useEffect(() => {
        if (values.DATABASE_TYPE === 'H2') {
            setMetamodelTypes([
                'As Flat Table',
                'As Suggested Metamodel',
                'From Scratch',
                'From Prop File',
            ]);
            reset({ ...values, METAMODEL_TYPE: 'As Suggested Metamodel' });
        }
        if (
            values.DATABASE_TYPE === 'RDF' ||
            values.DATABASE_TYPE === 'Tinker'
        ) {
            setMetamodelTypes([
                'As Suggested Metamodel',
                'From Scratch',
                'From Prop File',
            ]);
            reset({ ...values, METAMODEL_TYPE: 'As Suggested Metamodel' });
        }
        if (values.DATABASE_TYPE === 'R') {
            setMetamodelTypes(['As Flat Table']);
            reset({ ...values, METAMODEL_TYPE: 'As Flat Table' });
        }
    }, [values.DATABASE_TYPE]);

    const nodes = useMemo(() => {
        const formattedNodes = [];

        // TO-DO: fix TS errors on metamodel and node
        if (metamodel) {
            Object.entries(metamodel.positions).forEach((table, i) => {
                // table = ['db name', {x: '', y: '' }]
                const node = {
                    data: {
                        name: table[0],
                        properties: [], // get columns from metamodel.nodeProp
                    },
                    id: table[0],
                    position: { x: table[1].left, y: table[1].top },
                    type: 'metamodel',
                };

                // first see if there is a property for the table name in .nodeProp
                if (metamodel.nodeProp[table[0]]) {
                    const columnsForTable = metamodel.nodeProp[table[0]];

                    columnsForTable.forEach((col) => {
                        const foundColumn = metamodel.dataTypes[col];

                        node.data.properties.push({
                            id: table[0] + '__' + col,
                            name: col,
                            type: foundColumn,
                        });
                    });
                } else {
                    const foundColumn = metamodel.dataTypes[table[0]];
                    node.data.properties.push({
                        id: table[0],
                        name: table[0],
                        type: foundColumn,
                    });
                }
                formattedNodes.push(node);
            });
        }

        return formattedNodes;
    }, [metamodel]);

    const edges = useMemo(() => {
        const newEdges = [];
        if (metamodel) {
            metamodel.relation.forEach((rel) => {
                newEdges.push({
                    id: rel.relName,
                    type: 'floating',
                    source: rel.fromTable,
                    target: rel.toTable,
                });
            });
        }
        return newEdges;
    }, [metamodel]);

    const submitMetmodelPixel = async (payloadObject) => {
        let pixel = `databaseVar = RdbmsCsvUpload(database=["${watchDatabaseName}"], filePath=["${
            watchFile.name
        }"], delimiter=["${watchDelimeter}"], metamodel=["${JSON.stringify(
            payloadObject.metamodel,
        )}"], newHeaders=["${JSON.stringify(
            payloadObject.newHeaders,
        )}"], additionalDataTypes=["${JSON.stringify(
            payloadObject.additionalDataTypes,
        )}"], dataTypeMap=["${JSON.stringify(
            payloadObject.dataTypeMap,
        )}"] descriptionMap=["${JSON.stringify(
            payloadObject.descriptionMap,
        )}"], logicalNamesMap=["${JSON.stringify(
            payloadObject.logicalNamesMap,
        )}"], existing=[false]); `;

        pixel += `ExtractDatabaseMeta( database=[databaseVar]);`;

        pixel += `SaveOwlPositions(database=[databaseVar], positionMap=[${JSON.stringify(
            metamodel.positions,
        )}])`;

        const response = await monolithStore.runQuery(pixel);

        const { output, additionalOutput, operationType } =
            response.pixelReturn[0];

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });

            return;
        } else {
            notification.add({
                color: 'success',
                message: additionalOutput[0].output,
            });
            navigate(`/database/${output.database_id}`);
        }
    };

    metamodel ? console.log(metamodel) : null;
    console.log(edges, nodes);

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
                <DataFormTable predictDataTypes={predictDataTypes} />
            )}
            {/* Workflow 2 */}
            {metamodel && (
                <div style={{ width: '100%', height: '600px' }}>
                    <Metamodel
                        callback={submitMetmodelPixel}
                        edges={edges}
                        nodes={nodes}
                        isInteractive={true}
                    />
                </div>
            )}
        </>
    );
};

CSVForm.name2 = 'CSV';

CSVForm.logo = 'path_to_logo';
