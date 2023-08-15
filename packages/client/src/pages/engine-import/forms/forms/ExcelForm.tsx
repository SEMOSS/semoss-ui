import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, Stack, Select, Menu } from '@semoss/ui';
import { FileDropzone } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';
import { Metamodel } from '@/components/metamodel';
import { useRootStore } from '@/hooks';
import { DataFormTable } from './../DataFormTable';

export const ExcelForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel, predictDataTypes } = props;
    const { control, handleSubmit, watch, reset, getValues } = useForm();

    const [metamodelTypes, setMetamodelTypes] = React.useState([
        'As Flat Table',
        'Excel Loader Sheet Format',
    ]);

    const { monolithStore } = useRootStore();
    const values = getValues();

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
        console.log(values.FILE);
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

    const nodes = React.useMemo(() => {
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

    const edges = React.useMemo(() => {
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

    const submitMetmodelPixel = async (edges) => {
        const dataTypeObject = {};
        const nodePropObject = {};

        nodes.forEach((n) => {
            dataTypeObject[`${n.data.name}`] = n.data.properties[0].type;
            nodePropObject[`${n.data.name}`] = [];
        });

        const resp = await monolithStore.runQuery(
            `databaseVar = RdbmsCsvUpload(database=["${watchDatabaseName}"], filePath=["${
                watchFile.name
            }"], delimiter=["${watchDelimeter}"], metamodel=[{"relation": ${JSON.stringify(
                metamodel.relation,
            )}, "nodeProp": ${JSON.stringify(
                nodePropObject,
            )}}], dataTypeMap=[${JSON.stringify(
                dataTypeObject,
            )}], newHeaders=[{}], additionalDataTypes=[{}], descriptionMap=[{}], logicalNamesMap=[{}], existing=[false])`,
        );

        // const output = resp.pixelReturn[0].output;

        // const resp2 = await monolithStore.runQuery(
        //     `ExtractDatabaseMeta( database=[databaseVar]);SaveOwlPositions(database=[databaseVar], positionMap=[${JSON.stringify(
        //         metamodel.positions,
        //     )}]);`,
        // );
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
                <DataFormTable predictDataTypes={predictDataTypes} />
            )}
            {/* Workflow 2 */}
            {metamodel && (
                <div style={{ width: '100%', height: '600px' }}>
                    <Metamodel
                        callback={submitMetmodelPixel}
                        onSelectNode={null}
                        edges={edges}
                        nodes={nodes}
                    />
                </div>
            )}
        </>
    );
};

ExcelForm.name2 = 'Excel';

ExcelForm.logo = 'path_to_logo';
