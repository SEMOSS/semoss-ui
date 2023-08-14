import React, { useState, useEffect } from 'react';
import {
    Modal,
    styled,
    theme,
    Form,
    Button,
    Table,
    Radio,
    Icon,
    useNotification,
    TextField,
} from '@semoss/ui';
import { mdiDelete, mdiPlus, mdiPlusCircle } from '@mdi/js';

import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { useRootStore, usePixel, useAPI } from '@/hooks';
import { MonolithStore } from '@/stores/monolith';

// CUSTOM STYLES
const StyledField = styled('div')(() => ({
    marginBottom: theme.space['4'],
}));

const StyledModalActions = styled(Modal.Actions)(() => ({
    display: 'flex',
    justifyContent: 'center',
}));
const StyledRowAdd = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
    height: '6rem',
}));

const StyledCell = styled(Table.Cell)(() => ({
    height: '3rem',
    minHeight: '3rem',
}));

const StyledSmallCell = styled(StyledCell)(() => ({
    width: '10%',
}));
const StyledCellContent = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    height: '2rem',
    minHeight: '2rem',
}));
const StyledRowNum = styled('div')(() => ({
    width: '2rem',
    textOverflow: 'ellipsis',
}));
// const StyledRadio = styled(Radio, {
//     width: '100%',
// });

const StyledAdditionalInfoCell = styled(StyledCell)(() => ({
    width: '20%',
}));
const StyledCellContentQuickActions = styled(StyledCellContent)(() => ({
    justifyContent: 'center',
}));
const StyledTableContainer = styled('div')(() => ({
    padding: '9px',
}));
const StyledRadioContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
}));
const StyledRadio = styled(Radio)(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

// FUNCTIONS
const syncDatabaseWithLocal = (id, monolithStore, notification) => {
    const pixelString = `SyncDatabaseWithLocalMaster ( database = [ "${id}"] )`;

    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully added table`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
    });
    return success;
};
const refreshMetamodel = (id, monolithStore, notification) => {
    const pixelString = `GetDatabaseMetamodel( database=["${id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"])`;

    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully added table`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
    });
    return success;
};

const editTable = async (id, data, monolithStore, notification) => {
    const columnsToDelete = [];
    const columnsToAdd = [];
    // const tableObj = {
    //     [data.TABLE_NAME]: {},
    // };
    let success = true;

    let tableName = '';
    if (/\s/.test(data.TABLE_NAME)) {
        tableName = data.TABLE_NAME.replace(' ', '_');
    } else {
        tableName = data.TABLE_NAME;
    }

    data.TABLE_COLUMNS.forEach((col, i) => {
        if (col.deleteColumn) {
            // if column name has spacing, join with _
            if (/\s/.test(col.name)) {
                const newColName = col.name.replace(' ', '_');
                columnsToDelete.push(newColName);
            } else {
                columnsToDelete.push(col.name);
            }
        }
    });

    // if newColsToAdd: addColumns(tableObj)
    // the second conditional is used because we initialize the array with default object with empty values
    if (data.NEW_COLS_TO_ADD.length && data.NEW_COLS_TO_ADD[0].name.length) {
        const addColsObj = { [tableName]: {} };

        data.NEW_COLS_TO_ADD.forEach((col, i) => {
            addColsObj[tableName][col.name] = col.dataType;
        });

        const addedColumns = await addColumns(
            id,
            tableName,
            addColsObj,
            monolithStore,
            notification,
        );
        if (!addedColumns) {
            success = false;
        }
    }
    // if colsToDelete: deleteColumns()
    if (columnsToDelete.length) {
        const delColsObj = { [tableName]: columnsToDelete };
        const deletedColumns = await deleteColumns(
            id,
            tableName,
            delColsObj,
            monolithStore,
            notification,
        );

        if (!deletedColumns) {
            success = false;
        }
    }

    // if (data)
    // loop over TABLE_COLUMNS: if any column as deleteColumn set to true then add to columnsToDelete
    return success;
};

// DATABASE("database","Name of the datasource"),
const addColumns = (
    id,
    tableName,
    colData,
    monolithStore,
    notification,
): Promise<boolean> => {
    /**
     * tableData: {
     * NEW_COLS_TO_ADD: [ {dataType: '', isPrimaryKey: bool, name: '', notNul: bool}], TABLE_DESCRIPTION: '',TABLE_NAME: ''}
     *  */

    const pixelString = `AddDatabaseStructure(database=['${id}'],metamodelAdd=[${JSON.stringify(
        colData,
    )}])`;

    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully added columns: ${JSON.stringify(
                    Object.keys(colData[tableName]),
                )} to table: ${tableName}`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
    });
    return success;
};
// DATABASE("database","Name of the datasource"),
const deleteColumns = (
    id,
    tableName,
    colData,
    monolithStore,
    notification,
): Promise<boolean> => {
    /**
     * tableData: {
     * NEW_COLS_TO_ADD: [ {dataType: '', isPrimaryKey: bool, name: '', notNul: bool}], TABLE_DESCRIPTION: '',TABLE_NAME: ''}
     *  */

    const pixelString = `DeleteDatabaseStructure(database=['${id}'],metamodelDelete=[${JSON.stringify(
        colData,
    )}])`;

    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully deleted columns: ${colData[tableName]},
                )} from table: ${tableName}`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
    });

    return success;
};

const changeTableName = (
    id,
    originalTableName,
    newTableName,
    monolithStore,
    notification,
): Promise<boolean> => {
    // clean table names

    if (/\s/.test(originalTableName)) {
        originalTableName = originalTableName.replace(' ', '_');
    }
    if (/\s/.test(newTableName)) {
        newTableName = newTableName.replace(' ', '_');
    }

    const pixelString = `DatabaseRenameTable(database=['${id}'], concept=['${originalTableName}'], newValue=["${newTableName}"]);`;
    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully changed table name from ${originalTableName}, to ${newTableName}`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
    });

    return success;
};

/**
 * QUESTIONS:
 *  1. Do we want to reset data on Add Table modal Exit and/or Close?
 *  2.
 */

export const EditTableModal = ({
    id,
    openEditTableModal,
    setOpenEditTableModal,
    tableData, // { tableName: '', columns: [ {id, name, type } ]}
}) => {
    const { monolithStore } = useRootStore();
    // notification service
    const notification = useNotification();
    const originalTableName = tableData.tableName;
    const cleanedColumns = [];
    // loop over tabledata to create matching table info/columns info
    if (Object.keys(tableData).length && tableData.columns.length) {
        for (const column of tableData.columns) {
            const cleanColumn = {
                name: column.name,
                dataType: column.type,
                notNull: false,
                isPrimaryKey: false,
                deleteColumn: false,
            };
            cleanedColumns.push(cleanColumn);
        }
    }

    const db = id;
    const { control, watch, setValue, register, handleSubmit } = useForm<{
        TABLE_NAME: string;
        TABLE_DESCRIPTION: string;
        TABLE_COLUMNS: any[];
        NEW_COLS_TO_ADD: {
            name: string;
            dataType: string;
            notNull: boolean;
            isPrimaryKey: boolean;
        }[];
        COLS_TO_DELETE: string[];
        ACTIVE_TAB: string;
    }>({
        defaultValues: {
            TABLE_NAME: tableData.tableName,
            TABLE_DESCRIPTION: tableData.tableDescription,
            TABLE_COLUMNS: cleanedColumns,
            NEW_COLS_TO_ADD: [
                {
                    name: '',
                    dataType: '',
                    notNull: false,
                    isPrimaryKey: false,
                },
            ],
            COLS_TO_DELETE: [],
            ACTIVE_TAB: 'ADD_COLUMNS',
        },
    });

    const tableName = watch('TABLE_NAME');
    const tableDescription = watch('TABLE_DESCRIPTION');
    const tableColumns = watch('TABLE_COLUMNS');
    const colsToDelete = watch('COLS_TO_DELETE');
    const activeTab = watch('ACTIVE_TAB');

    const { fields, append, remove } = useFieldArray({
        name: 'NEW_COLS_TO_ADD',
        control,
    });

    // pixel call to update table with changes
    const onSubmit = async (data) => {
        const editSuccessful = await editTable(
            id,
            data,
            monolithStore,
            notification,
        );

        let changeNameSuccessful = true;
        // change table name
        if (originalTableName !== tableName) {
            changeNameSuccessful = await changeTableName(
                id,
                originalTableName,
                tableName,
                monolithStore,
                notification,
            );
        }

        if (!editSuccessful || !changeNameSuccessful) {
            // keep modal open
        } else {
            // close modal
            // await syncDatabaseWithLocal(id, monolithStore, notification);
            // await refreshMetamodel(id, monolithStore, notification);
            setOpenEditTableModal(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Modal
                open={openEditTableModal}
                onClose={() => setOpenEditTableModal(false)}
            >
                <Modal.Content size={'lg'}>
                    <Modal.Title>Edit Table: {tableData.tableName}</Modal.Title>
                    <Modal.Content>
                        <>
                            <StyledField>
                                <TextField
                                    name={'TABLE_NAME'}
                                    label="Table name"
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Enter table name',
                                        size: 'md',
                                    }}
                                    error="Table name is required"
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'TABLE_DESCRIPTION'}
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'textarea',
                                        placeholder: 'enter table description',
                                    }}
                                    description=""
                                    label="Table description"
                                ></TextField>
                            </StyledField>
                            {/* <StyledField> */}
                            <StyledRadioContainer>
                                <StyledRadio
                                    value={watch('ACTIVE_TAB')}
                                    onChange={(value) => {
                                        setValue('ACTIVE_TAB', value);
                                    }}
                                    orientation="horizontal"
                                >
                                    <Radio.Item value="ADD_COLUMNS">
                                        Add Columns
                                    </Radio.Item>

                                    <Radio.Item value="DELETE_COLUMNS">
                                        Delete Columns
                                    </Radio.Item>
                                </StyledRadio>
                            </StyledRadioContainer>
                            {/* </StyledField> */}
                            <StyledField>
                                {activeTab === 'ADD_COLUMNS' ? (
                                    <StyledTableContainer>
                                        <Table striped={false} border={true}>
                                            <Table.Head>
                                                <Table.Row>
                                                    <StyledSmallCell>
                                                        <StyledCellContent>
                                                            <StyledRowNum>
                                                                &nbsp;
                                                            </StyledRowNum>
                                                        </StyledCellContent>
                                                    </StyledSmallCell>
                                                    <Table.Cell>
                                                        Name
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Data Type
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Not NULL?
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Primary Key?
                                                    </Table.Cell>
                                                    <StyledSmallCell></StyledSmallCell>
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {fields.map((field, i) => {
                                                    return (
                                                        <Table.Row
                                                            key={field.id}
                                                        >
                                                            <StyledSmallCell>
                                                                <StyledCellContent>
                                                                    <StyledRowNum>
                                                                        {i + 1}
                                                                    </StyledRowNum>
                                                                </StyledCellContent>
                                                            </StyledSmallCell>
                                                            <StyledCell>
                                                                <TextField
                                                                    {...register(
                                                                        `NEW_COLS_TO_ADD.${i}.name` as const,
                                                                    )}
                                                                    control={
                                                                        control
                                                                    }
                                                                    rules={{
                                                                        required:
                                                                            false,
                                                                    }}
                                                                    options={{
                                                                        component:
                                                                            'input',
                                                                        placeholder:
                                                                            'column name',
                                                                    }}
                                                                ></TextField>
                                                            </StyledCell>
                                                            <StyledCell>
                                                                <TextField
                                                                    {...register(
                                                                        `NEW_COLS_TO_ADD.${i}.dataType` as const,
                                                                    )}
                                                                    control={
                                                                        control
                                                                    }
                                                                    rules={{}}
                                                                    options={{
                                                                        component:
                                                                            'select',
                                                                        options:
                                                                            [
                                                                                'INT',
                                                                                'DOUBLE',
                                                                                'STRING',
                                                                                'BOOLEAN',
                                                                                'DATE',
                                                                                'TIMESTAMP',
                                                                            ],
                                                                        placeholder:
                                                                            'Select data type',
                                                                    }}
                                                                    description=""
                                                                    layout="horizontal"
                                                                    onChange={() => {
                                                                        // reset page
                                                                        console.log(
                                                                            'data type',
                                                                        );
                                                                    }}
                                                                ></TextField>
                                                            </StyledCell>

                                                            <StyledCell>
                                                                <StyledCellContent>
                                                                    <TextField
                                                                        {...register(
                                                                            `NEW_COLS_TO_ADD.${i}.notNull` as const,
                                                                        )}
                                                                        control={
                                                                            control
                                                                        }
                                                                        rules={{}}
                                                                        options={{
                                                                            component:
                                                                                'checkbox',
                                                                        }}
                                                                        onChange={() => {
                                                                            // reset page
                                                                            console.log(
                                                                                'not null',
                                                                            );
                                                                        }}
                                                                    ></TextField>
                                                                </StyledCellContent>
                                                            </StyledCell>
                                                            <StyledCell>
                                                                <StyledCellContent>
                                                                    <TextField
                                                                        {...register(
                                                                            `NEW_COLS_TO_ADD.${i}.isPrimaryKey` as const,
                                                                        )}
                                                                        control={
                                                                            control
                                                                        }
                                                                        rules={{}}
                                                                        options={{
                                                                            component:
                                                                                'checkbox',
                                                                        }}
                                                                        onChange={() => {
                                                                            // reset page
                                                                            console.log(
                                                                                'primary key',
                                                                            );
                                                                        }}
                                                                    ></TextField>
                                                                </StyledCellContent>
                                                            </StyledCell>
                                                            <StyledSmallCell>
                                                                <StyledCellContentQuickActions>
                                                                    <Button
                                                                        variant={
                                                                            'text'
                                                                        }
                                                                        color={
                                                                            'error'
                                                                        }
                                                                        onClick={() => {
                                                                            if (
                                                                                fields.length >
                                                                                0
                                                                            ) {
                                                                                remove(
                                                                                    i,
                                                                                );
                                                                            } else {
                                                                                // empty the values
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Icon
                                                                            path={
                                                                                mdiDelete
                                                                            }
                                                                            size="md"
                                                                        ></Icon>
                                                                    </Button>
                                                                </StyledCellContentQuickActions>
                                                            </StyledSmallCell>
                                                        </Table.Row>
                                                    );
                                                })}
                                            </Table.Body>
                                        </Table>
                                        <StyledRowAdd>
                                            <Button
                                                variant={'text'}
                                                color={'primary'}
                                                onClick={() =>
                                                    append({
                                                        name: '',
                                                        dataType: 'string',
                                                        notNull: false,
                                                        isPrimaryKey: false,
                                                    })
                                                }
                                            >
                                                <Icon
                                                    path={mdiPlus}
                                                    size="lg"
                                                ></Icon>
                                            </Button>
                                        </StyledRowAdd>
                                    </StyledTableContainer>
                                ) : (
                                    <StyledTableContainer>
                                        <Table striped={false} border={true}>
                                            <Table.Head>
                                                <Table.Row>
                                                    <Table.Cell>
                                                        Delete Column
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Name
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Data Type
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Not NULL?
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        Primary Key?
                                                    </Table.Cell>
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {tableColumns.map(
                                                    (column, idx) => {
                                                        return (
                                                            <Table.Row
                                                                key={idx}
                                                            >
                                                                <StyledCell>
                                                                    <StyledCellContent>
                                                                        <TextField
                                                                            name={`TABLE_COLUMNS.${idx}.deleteColumn`}
                                                                            control={
                                                                                control
                                                                            }
                                                                            rules={{}}
                                                                            options={{
                                                                                component:
                                                                                    'checkbox',
                                                                            }}
                                                                            onChange={() => {
                                                                                // reset page
                                                                                // no-op... column marked for delete
                                                                            }}
                                                                        ></TextField>
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                                <StyledCell>
                                                                    <StyledCellContent>
                                                                        {
                                                                            column.name
                                                                        }
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                                <StyledCell>
                                                                    <StyledCellContent>
                                                                        {
                                                                            column.dataType
                                                                        }
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                                <StyledCell>
                                                                    <StyledCellContent>
                                                                        <TextField
                                                                            name={`TABLE_COLUMNS.${idx}.notNull`}
                                                                            control={
                                                                                control
                                                                            }
                                                                            rules={{}}
                                                                            options={{
                                                                                component:
                                                                                    'checkbox',
                                                                            }}
                                                                            onChange={() => {
                                                                                // reset page
                                                                                console.log(
                                                                                    'Delete Column',
                                                                                );
                                                                            }}
                                                                            disabled
                                                                        ></TextField>
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                                <StyledCell>
                                                                    <StyledCellContent>
                                                                        <TextField
                                                                            name={`TABLE_COLUMNS.${idx}.isPrimaryKey`}
                                                                            control={
                                                                                control
                                                                            }
                                                                            rules={{}}
                                                                            options={{
                                                                                component:
                                                                                    'checkbox',
                                                                            }}
                                                                            onChange={() => {
                                                                                // reset page
                                                                                // no-op column marked as primary key or not
                                                                            }}
                                                                            disabled
                                                                        ></TextField>
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                            </Table.Row>
                                                        );
                                                    },
                                                )}
                                            </Table.Body>
                                        </Table>
                                    </StyledTableContainer>
                                )}
                            </StyledField>
                        </>
                    </Modal.Content>
                    <StyledModalActions>
                        <Button
                            color={'grey'}
                            variant="text"
                            onClick={() => setOpenEditTableModal(false)}
                        >
                            Close
                        </Button>

                        <Button
                            color={'success'}
                            onClick={handleSubmit(onSubmit)}
                        >
                            Submit
                        </Button>
                    </StyledModalActions>
                </Modal.Content>
            </Modal>
        </Form>
    );
};
