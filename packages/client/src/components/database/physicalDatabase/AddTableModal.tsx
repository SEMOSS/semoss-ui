import React, { useState, useEffect } from 'react';
import { Navigate, useResolvedPath, useNavigate } from 'react-router-dom';

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
import {
    useRootStore,
    usePixel,
    useAPI,
    useDatabase,
    useMetamodel,
} from '@/hooks';

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
const StyledRadio = styled(Radio)(() => ({
    width: '100%',
}));
const StyledAdditionalInfoCell = styled(StyledCell)(() => ({
    width: '20%',
}));
const StyledCellContentQuickActions = styled(StyledCellContent)(() => ({
    justifyContent: 'center',
}));

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

// DATABASE("database","Name of the datasource"),
const addTable = (
    id,
    tableData,
    monolithStore,
    notification,
): Promise<boolean> => {
    /**
     * tableData: {
     * NEW_COLS_TO_ADD: [ {dataType: '', isPrimaryKey: bool, name: '', notNul: bool}], TABLE_DESCRIPTION: '',TABLE_NAME: ''}
     *  */
    const table = {
        [tableData.TABLE_NAME]: {},
    };

    // loop over columns and add each column to the table
    tableData.NEW_COLS_TO_ADD.forEach((column, i) => {
        table[tableData.TABLE_NAME][column.name] = 'BOOLEAN';
    });

    const pixelString = `AddDatabaseStructure(database=['${id}'],metamodelAdd=[${JSON.stringify(
        table,
    )}])`;

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

const isTableNameValid = (name, tableNames) => {
    // check if the table name exists already
    if (tableNames.indexOf(name) > -1) {
        return false;
    }

    const letterRegEx = new RegExp(/^[a-z]/i);

    // if not return false
    // check that the table name is formatted in a valid format
    if (
        name.includes(' ') ||
        !letterRegEx.test(name[0]) ||
        name[name.length - 1] === '_'
    ) {
        return false;
    }
    // if not return false
    // return true
    return true;
};

/**
 * QUESTIONS:
 *  1. Do we want to reset data on Add Table modal Exit and/or Close?
 *  2.
 */

export const AddTableModal = ({
    id,
    openAddTableModal,
    setOpenAddTableModal,
    onClose,
    getDatabaseMetamodel,
}) => {
    // console.log('add table getDatabaseMetamodel: ', getDatabaseMetamodel);
    const [openModal, setOpenModal] = useState(true);
    const [existingTableName, setExistingTableName] = useState([]);

    const db = id;

    const { monolithStore } = useRootStore();
    // notification service
    const notification = useNotification();

    type FormValues = {
        TABLE_NAME: string;
        TABLE_DESCRIPTION: string;
        TABLE_COLUMNS: any[];
        NEW_COLS_TO_ADD: {
            name: string;
            dataType: string;
            notNull: boolean;
            isPrimaryKey: boolean;
        }[];
    };

    const form = useForm<FormValues>({
        defaultValues: {
            TABLE_NAME: '',
            TABLE_DESCRIPTION: '',
            TABLE_COLUMNS: [],
            NEW_COLS_TO_ADD: [
                {
                    name: '',
                    dataType: '',
                    notNull: false,
                    isPrimaryKey: false,
                },
            ],
        },
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        setError,
        formState,
    } = form;

    const { errors } = formState;

    // const {
    //     control,
    //     watch,
    //     setValue,
    //     register,
    //     handleSubmit,
    //     setError,
    //     formState: { errors },
    // } = useForm<FormValues>({
    //     defaultValues: {
    //         TABLE_NAME: '',
    //         TABLE_DESCRIPTION: '',
    //         TABLE_COLUMNS: [],
    //         NEW_COLS_TO_ADD: [
    //             {
    //                 name: '',
    //                 dataType: '',
    //                 notNull: false,
    //                 isPrimaryKey: false,
    //             },
    //         ],
    //     },
    // });

    const tableName = watch('TABLE_NAME');
    const tableDescription = watch('TABLE_DESCRIPTION');
    const tableColumns = watch('TABLE_COLUMNS');

    const { fields, append, remove } = useFieldArray({
        name: 'NEW_COLS_TO_ADD',
        control,
    });

    // pixel call to add new table to database
    const onSubmit = async (data) => {
        console.log('data is: ', data);

        // validate data

        const isNameValid = isTableNameValid(
            data.TABLE_NAME,
            existingTableName,
        );

        // if invalid, add to errors and dispatch error
        if (!isNameValid) {
            setError(
                'TABLE_NAME',
                {
                    type: 'custom',
                    message:
                        'Table name must be unique, should begin with a letter, should NOT end with an underscore, and should NOT contain any spaces',
                },
                { shouldFocus: true },
            );
            return;
        }
        const addSuccessful = await addTable(
            id,
            data,
            monolithStore,
            notification,
        );

        if (!addSuccessful) {
            //keep modal open
        } else {
            setOpenAddTableModal(false);
            // refresh metamodel
            // await syncDatabaseWithLocal(id, monolithStore, notification);
            // await refreshMetamodel(id, monolithStore, notification);
            onClose();
        }
    };

    useEffect(() => {
        if (
            getDatabaseMetamodel.data &&
            getDatabaseMetamodel?.data.nodes?.length
        ) {
            const tempExistingTableNames = [];

            // loop over nodes and push table names into existingTableNames
            getDatabaseMetamodel.data.nodes.forEach((node) => {
                tempExistingTableNames.push(node.conceptualName);
            });
            setExistingTableName(tempExistingTableNames);
        }
    }, [getDatabaseMetamodel]);

    // @desc checks if the table name exists in the db already
    // @return true / false
    // const tableNameValidator = (name) => {
    //     console.log('name: ', name);
    //     console.log('existingtablename: ', existingTableName);
    //     if (existingTableName.indexOf(name) > -1) {
    //         return true;
    //     }
    //     return false;
    // };

    // TABLE NAME VALIDATION
    // useEffect(() => {
    //     console.log('tableName is: ', tableName);
    //     let valid = false;
    //     if (tableName.length) {
    //         valid = tableNameValidator(tableName);
    //     }
    //     if (valid) {
    //         // no-op
    //         // setError();
    //     } else {
    //         setError(
    //             'TABLE_NAME',
    //             { type: 'custom', message: 'Table name must be unique' },
    //             { shouldFocus: true },
    //         );
    //     }
    // }, [tableName]);

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Modal
                open={openAddTableModal}
                onClose={() => setOpenAddTableModal(false)}
            >
                <Modal.Content size={'lg'}>
                    <Modal.Title>Add Table</Modal.Title>
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
                                    error={errors.TABLE_NAME?.message}
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
                            <StyledField>
                                <Table striped={false} border={false}>
                                    <Table.Head>
                                        <Table.Row>
                                            <StyledSmallCell>
                                                <StyledCellContent>
                                                    <StyledRowNum>
                                                        &nbsp;
                                                    </StyledRowNum>
                                                </StyledCellContent>
                                            </StyledSmallCell>
                                            <Table.Cell>Name</Table.Cell>
                                            <Table.Cell>Data Type</Table.Cell>
                                            <Table.Cell>Not NULL?</Table.Cell>
                                            <Table.Cell>
                                                Primary Key?
                                            </Table.Cell>
                                            <StyledSmallCell></StyledSmallCell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {fields.map((field, i) => {
                                            return (
                                                <Table.Row key={field.id}>
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
                                                            control={control}
                                                            rules={{
                                                                required: false,
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
                                                            control={control}
                                                            rules={{}}
                                                            options={{
                                                                component:
                                                                    'select',
                                                                options: [
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
                                                                variant={'text'}
                                                                color={'error'}
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
                            </StyledField>
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
                                    <Icon path={mdiPlus} size="lg"></Icon>
                                </Button>
                            </StyledRowAdd>
                        </>
                    </Modal.Content>
                    <StyledModalActions>
                        <Button
                            color={'grey'}
                            variant="text"
                            onClick={() => setOpenAddTableModal(false)}
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
