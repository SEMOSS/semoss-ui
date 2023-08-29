import React, { useEffect, useState, useMemo } from 'react';
import {
    styled,
    Box,
    Button,
    Modal,
    Skeleton,
    Stack,
    Typography,
    Checkbox,
    useNotification,
} from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { useRootStore } from '@/hooks';
import { useImport } from '@/hooks';
import { Metamodel } from '@/components/metamodel';

const StyledBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '16px 16px 16px 16px',
    marginBottom: '32px',
});

export const ImportConnectionPage = () => {
    // Right now this is purposed for the DB Connectors;
    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const { steps, setSteps, setIsLoading } = useImport();

    const insightId = configStore.store.insightID;

    const [openModal, setOpenModal] = useState(false);
    const [tables, setTables] = useState([]);
    const [views, setviews] = useState([]);

    // Used for edges and nodes
    const [metamodel, setMetamodel] = useState(null);

    useEffect(() => {
        // If Database Connector
        getTablesAndViews();

        // If Excel (Drag and Drop)
        return () => {
            setMetamodel(null);
        };
    }, []);

    /**
     * @name getTablesAndViews
     * @desc connects to db for user to make selection on tables to bring into metamodel
     */
    const getTablesAndViews = async () => {
        setIsLoading(true);

        const formDetails = steps[steps.length - 1];
        const pixel = `ExternalJdbcTablesAndViews(conDetails=[
          ${JSON.stringify(formDetails.data)}
        ])`;

        const resp = await monolithStore.runQuery(pixel);
        const output = resp.pixelReturn[0].output,
            operationType = resp.pixelReturn[0].operationType;

        setIsLoading(false);

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output ? output : 'Error connecting to database',
            });

            const newSteps = [steps[0], steps[1]];

            // go back to form step
            setSteps(newSteps, 1);
        } else {
            setOpenModal(true);
            setTables(output.tables);
            setviews(output.views);
        }
        return;
    };

    const dbConnectMetamodelRetrieval = async (data) => {
        setIsLoading(true);

        const formDetails = steps[steps.length - 1];

        let pixel = '';
        pixel += `
        ExternalJdbcSchema(conDetails=[${JSON.stringify(
            formDetails.data,
        )}], filters=[${data.tables}]);
        `;

        const resp = await monolithStore.runQuery(pixel);
        const output = resp.pixelReturn[0].output,
            operationType = resp.pixelReturn[0].operationType;

        setIsLoading(false);

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
        } else {
            setMetamodel(output);
            setOpenModal(false);
        }
    };

    const returnToTablesAndViews = () => {
        setMetamodel(null);
        setOpenModal(true);
    };

    return (
        <>
            {openModal ? (
                <TablesViewsSelection
                    open={openModal}
                    onClose={(values) => {
                        dbConnectMetamodelRetrieval(values);
                    }}
                    tables={tables}
                    views={views}
                />
            ) : null}
            {/* Metamodel */}
            {metamodel ? (
                <StyledBox>
                    <MetamodelView
                        metamodel={metamodel}
                        returnToTablesAndViews={returnToTablesAndViews}
                    />
                </StyledBox>
            ) : null}
        </>
    );
};

interface TablesViewsSelectionProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (values: { tables: string[]; views: string[] }) => void;

    /**  Database Tables to select */
    tables: string[];

    /**  Database Views to select */
    views: string[];
}

const TablesViewsSelection = (props: TablesViewsSelectionProps) => {
    const { open = false, onClose = () => null, tables, views } = props;

    const { steps, setSteps } = useImport();

    const [checkedTables, setCheckedTables] = useState({});
    const [checkedViews, setCheckedViews] = useState({});

    /**
     * @desc for checklist
     */
    useEffect(() => {
        // default all tables as checked
        const newCheckedTables = {};
        tables.forEach((table) => {
            newCheckedTables[table] = true;
        });

        setCheckedTables(newCheckedTables);

        // default all views as checked
        const newCheckedViews = {};
        views.forEach((view) => {
            newCheckedViews[view] = true;
        });

        setCheckedViews(newCheckedTables);

        return () => {
            setCheckedTables({});
            setCheckedViews({});
        };
    }, [open, tables.length, views.length]);

    /**
     * @desc toggles tables checklist
     */
    const handleToggleTables = (item) => {
        setCheckedTables((prevCheckedTables) => ({
            ...prevCheckedTables,
            [item]: !prevCheckedTables[item],
        }));
    };

    /**
     * @desc toggles views checklist
     */
    const handleToggleViews = (item) => {
        setCheckedViews((prevCheckedViews) => ({
            ...prevCheckedViews,
            [item]: !prevCheckedViews[item],
        }));
    };

    /**
     * @desc formats tables and views to send to metamodeling pixel
     */
    const sendTableViewFilters = () => {
        const formattedTableList = [];
        const formattedViewList = [];

        Object.entries(checkedTables).forEach((table) => {
            if (table[1]) {
                formattedTableList.push(table[0]);
            }
        });

        Object.entries(checkedViews).forEach((view) => {
            if (view[1]) {
                formattedViewList.push(view[0]);
            }
        });

        onClose({
            tables: formattedTableList,
            views: formattedViewList,
        });
    };

    return (
        <Modal open={open} maxWidth="md">
            <Modal.Title>
                Select Tables and Views to grab from data source
            </Modal.Title>
            <Modal.Content>
                {open && (
                    <Stack direction={'row'} justifyContent={'space-between'}>
                        <div style={{ width: '400px' }}>
                            <Typography variant={'body1'}>Tables</Typography>

                            {tables.map((table, i) => {
                                return (
                                    <div key={i}>
                                        <Checkbox
                                            value={table}
                                            checked={
                                                checkedTables[table] || false
                                            }
                                            onChange={(value) => {
                                                handleToggleTables(table);
                                            }}
                                            label={<span>{table}</span>}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ width: '400px' }}>
                            <Typography variant={'body1'}>Views</Typography>
                            {views.map((view, i) => {
                                return (
                                    <div key={i}>
                                        <Checkbox
                                            value={view}
                                            checked={
                                                checkedViews[view] || false
                                            }
                                            onChange={(value) => {
                                                handleToggleViews(view);
                                            }}
                                            label={<span>{view}</span>}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </Stack>
                )}
            </Modal.Content>
            <Modal.Actions>
                <Button
                    onClick={() => {
                        setSteps([steps[0], steps[1]], 1);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant={'contained'}
                    onClick={() => {
                        sendTableViewFilters();
                    }}
                >
                    Apply
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

interface JDBCSchemaInterface {
    positions: Record<string, { top: number; left: number }>;
    tables: {
        columns: string[];
        isPrimKey: boolean[];
        raw_type: string[];
        table: string;
        type: string[];
    }[];
    relationships: { fromTable: string; toTable: string; relName: string }[];
}
interface MetamodelViewProps {
    metamodel: JDBCSchemaInterface;
    returnToTablesAndViews: () => void;
}

export const MetamodelView = (props: MetamodelViewProps) => {
    const { metamodel, returnToTablesAndViews } = props;

    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const { steps, setIsLoading, setSteps } = useImport();

    /**
     *
     * @param data
     * @desc Needs to be done at top level since this is very similar to other RDBMS dbs
     */
    const saveDatabase = async (data) => {
        const formDetails = steps[steps.length - 1];
        const relations = [];
        const tables = {};
        const owlPositions = {};

        setIsLoading(true);

        data.nodes.forEach((node) => {
            const tableInfo = node.data;
            const cols = node.data.properties;
            const firstCol = cols[0].name;

            if (!tables[tableInfo.name + '.' + firstCol]) {
                const columns = [];

                cols.forEach((col) => {
                    columns.push(col.name);
                });

                tables[tableInfo.name + '.' + firstCol] = columns;
            }

            if (!owlPositions[node.id]) {
                owlPositions[node.id] = {
                    top: node.position.y,
                    left: node.position.x,
                };
            }
        });

        const pixel = `databaseVar = RdbmsExternalUpload(conDetails=[
          ${JSON.stringify(formDetails.data)}
      ], database=["${formDetails.title}"], metamodel=[
          ${JSON.stringify({
              relationships: relations,
              tables: tables,
          })}
      ]); SaveOwlPositions(database=[databaseVar], positionMap=[
          ${JSON.stringify(owlPositions)}
      ]);`;

        const resp = await monolithStore.runQuery(pixel);
        const output = resp.pixelReturn[0].output,
            operationType = resp.pixelReturn[0].operationType;

        setIsLoading(false);

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

        if (metamodel) {
            Object.entries(metamodel.positions).forEach((table, i) => {
                const node = {
                    data: {
                        name: table[0],
                        properties: [], // get columns from metamodel.nodeProp
                    },
                    id: table[0],
                    position: { x: table[1].left, y: table[1].top },
                    type: 'metamodel',
                };

                const foundTable = metamodel.tables.find(
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
    }, [metamodel]);

    /**
     * @desc relations for metamodel
     */
    const edges = useMemo(() => {
        const newEdges = [];
        if (metamodel) {
            metamodel.relationships.forEach((rel) => {
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

    return (
        <div style={{ height: '70vh', width: '100%' }}>
            <div style={{ width: '100%', height: '95%' }}>
                <Metamodel
                    onSelectNode={null}
                    edges={edges}
                    nodes={nodes}
                    callback={(data) => {
                        saveDatabase(data);
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                }}
            >
                <Button
                    variant={'text'}
                    onClick={() => {
                        setSteps([steps[0], steps[1]], 1);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant={'outlined'}
                    onClick={() => returnToTablesAndViews()}
                >
                    Tables and Views
                </Button>
                <Button
                    variant={'contained'}
                    onClick={() => {
                        console.log('Apply new metamodel');
                    }}
                >
                    Apply
                </Button>
            </div>
        </div>
        // <Modal open={true} maxWidth={'xl'} fullWidth={true}>
        //     <Modal.Title>Metamodel</Modal.Title>
        //     <Modal.Content sx={{ height: '85vh' }}>
        //         <div style={{ width: '100%', height: '100%' }}>
        //             <Metamodel
        //                 onSelectNode={null}
        //                 edges={edges}
        //                 nodes={nodes}
        //                 callback={(data) => {
        //                     saveDatabase(data);
        //                 }}
        //             />
        //         </div>
        //     </Modal.Content>
        //     <Modal.Actions>
        //         <Button
        //             variant={'text'}
        //             onClick={() => {
        //                 setSteps([steps[0], steps[1]], 1);
        //             }}
        //         >
        //             Cancel
        //         </Button>
        //         <Button
        //             variant={'outlined'}
        //             onClick={() => returnToTablesAndViews()}
        //         >
        //             Tables and Views
        //         </Button>
        //         <Button
        //             variant={'contained'}
        //             onClick={() => {
        //                 console.log('Apply new metamodel');
        //             }}
        //         >
        //             Apply
        //         </Button>
        //     </Modal.Actions>
        // </Modal>
    );
};
