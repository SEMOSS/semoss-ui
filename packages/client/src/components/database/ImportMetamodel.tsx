import React, { useEffect, useState } from 'react';
import {
    Checkbox,
    Modal,
    Button,
    Stack,
    Typography,
    TextField,
    Autocomplete,
    useNotification,
    styled,
} from '@semoss/ui';
import { useForm, Controller } from 'react-hook-form';

interface ImportMetamodelProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (values: { tables: string[]; views: string[] }) => void;

    /**  Database Tables to select */
    tables: string[];

    /**  Database Views to select */
    views: string[];
}
export const ImportMetamodel = (props: ImportMetamodelProps) => {
    const { open = false, onClose = () => null, tables, views } = props;

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
    }, [open]);

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

    // ----------------------------------------
    // Metamodel View
    // ----------------------------------------

    // /**
    //  * @desc hit pixel call to get new meta vals to pass to metamodel
    //  */
    // const getMetaWithFilters = async (values) => {
    //     const originalFormVals = getValues();

    //     let pixel = '';
    //     // pixel += `
    //     // ExternalJdbcSchema(conDetails=[${JSON.stringify({
    //     //     dbDriver: originalFormVals.dbDriver,
    //     //     additional: originalFormVals.additional,
    //     //     hostname: originalFormVals.hostname,
    //     //     port: originalFormVals.port,
    //     //     database: originalFormVals.database,
    //     //     schema: originalFormVals.schema,
    //     //     USERNAME: originalFormVals.USERNAME,
    //     //     PASSWORD: originalFormVals.PASSWORD,
    //     //     USE_CONNECTION_POOLING: false,
    //     //     CONNECTION_URL: '',
    //     // })}], filters=[${metamodel.tables}]);
    //     // `;

    //     pixel += `
    //     ExternalJdbcSchema(conDetails=[
    //         {"dbDriver":"SQL_SERVER","additional":";encrypt=true;trustServerCertificate=true;","hostname":"18.213.113.140","port":"1433","database":"semoss_supply","schema":"dbo","USERNAME":"SA","PASSWORD":"semoss@123123"}
    //     ], filters=[${values.tables}]);
    //     `;

    //     const resp = await monolithStore.runQuery(pixel);
    //     const output = resp.pixelReturn[0].output,
    //         operationType = resp.pixelReturn[0].operationType;

    //     if (operationType.indexOf('ERROR') > -1) {
    //         notification.add({
    //             color: 'error',
    //             message: output,
    //         });
    //     } else {
    //         setSelectTablesModal(false);

    //         /** useMemos for edges and nodes should trigger */
    //         setNewMetamodel(output);
    //     }
    // };

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
                                                checkedViews[table] || false
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
