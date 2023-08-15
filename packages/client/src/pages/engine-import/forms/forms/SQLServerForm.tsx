import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, Stack, Modal } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';
import { useRootStore } from '@/hooks';
import { Metamodel } from '@/components/metamodel';

export const SQLServerForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel, predictDataTypes } = props;

    const { monolithStore } = useRootStore();
    const { control, reset, handleSubmit } = useForm({
        defaultValues: {
            dbDriver: 'SQL_SERVER',
            port: '1433',
            schema: 'dbo',
        },
    });

    /**
     *
     * @param data
     * @desc passes data to parent to show metamodel
     */
    const onSubmit = async (data) => {
        const dataWithLabel = {
            conDetails: {
                dbDriver: data.dbDriver,
                additional: data.additional,
                hostname: data.hostname,
                port: data.port,
                database: data.database,
                schema: data.schema,
                USERNAME: data.USERNAME,
                PASSWORD: data.PASSWORD,
                CONNECTION_URL: data.CONNECTION_URL,
            },
            type: 'connect', // represents connect to external
        };

        debugger;
        submitFunc(dataWithLabel);
    };

    /**
     * @desc tables for metamodel
     */
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

        debugger;
        return formattedNodes;
    }, [metamodel]);

    /**
     * @desc relations for metamodel
     */
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
        debugger;
        return newEdges;
    }, [metamodel]);

    return (
        <>
            {!metamodel && (
                <form onSubmit={handleSubmit(onSubmit)}>
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
                            name={'hostname'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        required
                                        fullWidth
                                        label="Host Name"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'port'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Port"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'database'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        required
                                        fullWidth
                                        label="Database"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'schema'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Schema"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'USERNAME'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'PASSWORD'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'additional'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Additional Parameters"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'CONNECTION_URL'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="JDBC Url"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        ADVANCED SETTINGS
                        <Controller
                            name={'FETCH_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Fetch Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'CONNECTION_TIMEOUT'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Connection Timeout"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'CONNECTION_POOLING'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Connection Pooling"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'POOL_MIN_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Pool Minimum Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'POOL_MAX_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Pool Maximum Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                    </Stack>
                    <Button type={'submit'}>Submit</Button>
                </form>
            )}
            <Modal>
                <Modal.Title></Modal.Title>
                <Modal.Content></Modal.Content>
            </Modal>
            {/* Metamodel */}
            <div style={{ width: '100%', height: '600px' }}>
                <Metamodel onSelectNode={null} edges={edges} nodes={nodes} />
            </div>
        </>
    );
};

SQLServerForm.name2 = 'SQLServer';

SQLServerForm.logo = 'path_to_logo';
