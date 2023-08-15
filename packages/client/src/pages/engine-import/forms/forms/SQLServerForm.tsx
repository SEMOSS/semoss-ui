import React, { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button,
    Checkbox,
    TextField,
    Stack,
    Typography,
    Modal,
    useNotification,
} from '@semoss/ui';
import { ImportFormComponent } from './formTypes';
import { useRootStore } from '@/hooks';
import { Metamodel } from '@/components/metamodel';
import { useNavigate } from 'react-router-dom';

interface SQLServerForm {
    submitFunc: () => void;
    metamodel: any;
}
export const SQLServerForm: ImportFormComponent = (props) => {
    const { submitFunc, metamodel } = props;

    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();

    const { control, handleSubmit, getValues } = useForm<{
        dbDriver: string;
        port: string;
        schema: string;
        additional: string;
        hostname: string;
        USERNAME: string;
        PASSWORD: string;
        database: string;
        DATABASE_NAME: string;
        DATABASE_DESCRIPTION: string;
        DATABASE_TAGS: string[];
        CONNECTION_URL: string;
        FETCH_SIZE: number;
        CONNECTION_TIMEOUT: number;
        CONNECTION_POOLING: number;
        POOL_MIN_SIZE: number;
        POOL_MAX_SIZE: number;
    }>({
        defaultValues: {
            dbDriver: 'SQL_SERVER',
            port: '1433',
            schema: 'dbo',
        },
    });

    const [selectTablesModal, setSelectTablesModal] = useState(true);
    const [newMetamodel, setNewMetamodel] = useState(null);

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

        submitFunc(dataWithLabel);
    };

    /**
     * @desc hit pixel call to get new meta vals to pass to metamodel
     */
    const getMetaWithFilters = async () => {
        const originalFormVals = getValues();

        console.log();
        let pixel = '';
        debugger;
        pixel += `
        ExternalJdbcSchema(conDetails=[${JSON.stringify({
            dbDriver: originalFormVals.dbDriver,
            additional: originalFormVals.additional,
            hostname: originalFormVals.hostname,
            port: originalFormVals.port,
            database: originalFormVals.database,
            schema: originalFormVals.schema,
            USERNAME: originalFormVals.USERNAME,
            PASSWORD: originalFormVals.PASSWORD,
            USE_CONNECTION_POOLING: false,
            CONNECTION_URL: '',
        })}], filters=["CATALOG","COMBINE_SHORTAGES","CATALOG_AUDIT"]);
        `;

        const resp = await monolithStore.runQuery(pixel);
        const output = resp.pixelReturn[0].output,
            operationType = resp.pixelReturn[0].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
        } else {
            setSelectTablesModal(false);

            /** useMemos for edges and nodes should trigger */
            setNewMetamodel(output);
        }
    };

    /**
     *
     * @param data
     * @desc Needs to be done at top level since this is very similar to other RDBMS dbs
     */
    const saveDatabase = async (data) => {
        const originalFormVals = getValues();

        const relations = [];
        const tables = {};
        const owlPositions = {};

        data.nodes.forEach((node) => {
            const tableInfo = node.data;
            const cols = node.data.properties;
            const firstCol = cols[0].name;

            if (!tables[tableInfo.name + '.' + firstCol]) {
                const columns = [];

                cols.forEach((col) => {
                    columns.push(col.name);
                });

                tables[tableInfo.name + firstCol] = columns;
            }

            if (owlPositions[node.id]) {
                owlPositions[node.id] = {
                    top: node.position.y,
                    left: node.position.x,
                };
            }
        });

        const pixel = `databaseVar = RdbmsExternalUpload(conDetails=[
            ${JSON.stringify({
                dbDriver: originalFormVals.dbDriver,
                additional: originalFormVals.additional,
                hostname: originalFormVals.hostname,
                port: originalFormVals.port,
                database: originalFormVals.database,
                schema: originalFormVals.schema,
                USERNAME: originalFormVals.USERNAME,
                PASSWORD: originalFormVals.PASSWORD,
                USE_CONNECTION_POOLING: false,
                CONNECTION_URL: '',
            })}
        ], database=["${originalFormVals.DATABASE_NAME}"], metamodel=[
            ${JSON.stringify({
                relationships: relations,
                tables: tables,
            })}
        ]); SaveOwlPositions(database=[databaseVar], positionMap=[
            ${JSON.stringify(owlPositions)}
        ]);`;

        debugger;
        console.log(data);

        const resp = await monolithStore.runQuery(pixel);

        const output = resp.pixelReturn[0].output,
            operationType = resp.pixelReturn[0].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            console.warn('RDBMSExternalUpload Reactor bug');
            notification.add({
                color: 'error',
                message: output,
            });
        } else {
            navigate(`/database/${output.database_id}`);
            return;
        }
    };

    /**
     * @desc tables for metamodel
     */
    const nodes = useMemo(() => {
        const formattedNodes = [];

        // TO-DO: fix TS errors on metamodel and node
        if (newMetamodel) {
            Object.entries(newMetamodel.positions).forEach((table, i) => {
                const node = {
                    data: {
                        name: table[0],
                        properties: [], // get columns from metamodel.nodeProp
                    },
                    id: table[0],
                    position: { x: table[1].left, y: table[1].top },
                    type: 'metamodel',
                };

                const foundTable = newMetamodel.tables.find(
                    (obj) => obj.table === table[0],
                );

                foundTable.columns.forEach((col, i) => {
                    node.data.properties.push({
                        id: table[0] + '__' + col,
                        name: col,
                        type: foundTable.type[i],
                    });
                });
                formattedNodes.push(node);
            });
        }

        return formattedNodes;
    }, [newMetamodel]);

    /**
     * @desc relations for metamodel
     */
    const edges = useMemo(() => {
        const newEdges = [];
        if (newMetamodel) {
            newMetamodel.relationships.forEach((rel) => {
                newEdges.push({
                    id: rel.relName,
                    type: 'floating',
                    source: rel.fromTable,
                    target: rel.toTable,
                });
            });
        }
        return newEdges;
    }, [newMetamodel]);

    // Temporary
    let showModal = false;
    if (metamodel && selectTablesModal) {
        showModal = true;
    }

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
            <Modal open={showModal} maxWidth="md">
                <Modal.Title>
                    Select Tables and Views to grab from data source
                </Modal.Title>
                <Modal.Content>
                    {showModal && (
                        <div
                            style={{
                                width: '900px',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ width: '150px' }}>
                                <Typography variant={'body1'}>
                                    Tables
                                </Typography>
                                {metamodel.tables.map((table, i) => {
                                    return (
                                        <div key={i}>
                                            <Checkbox
                                                value={table}
                                                checked={true}
                                                onChange={(value) => {
                                                    console.log(value);
                                                }}
                                                label={<span>{table}</span>}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ width: '150px' }}>
                                <Typography variant={'body1'}>Views</Typography>
                                {metamodel.views.map((view, i) => {
                                    return (
                                        <div key={i}>
                                            <Checkbox
                                                label={<span>{view}</span>}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            getMetaWithFilters();
                        }}
                    >
                        Metamodel
                    </Button>
                </Modal.Actions>
            </Modal>
            {/* Metamodel */}
            {newMetamodel && (
                <div style={{ width: '100%', height: '600px' }}>
                    <Metamodel
                        onSelectNode={null}
                        edges={edges}
                        nodes={nodes}
                        callback={(data) => {
                            saveDatabase(data);
                        }}
                    />
                </div>
            )}
        </>
    );
};

SQLServerForm.name2 = 'SQLServer';

SQLServerForm.logo = 'path_to_logo';
