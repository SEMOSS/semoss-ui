import React, { useState } from 'react';
import {
    Modal,
    styled,
    Button,
    useNotification,
    Stack,
    TextField,
    TextArea,
    Select,
    Menu,
    Checkbox,
} from '@/component-library';

import { useForm, Controller } from 'react-hook-form';
import { useRootStore } from '@/hooks';

// UI to update/modify column from the metamodel view
// pixel to update/modify column

// Edit Column UI

// user selects edit column icon

// popover modal:
// table name: READ ONLY
// column name
// column type
// column default value

// pixel to update/modify column

// STYLING
const ModalContainer = styled('div')(() => ({
    position: 'fixed',
    zIndex: '1',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'rgba(0,0,0,0.5)',
}));
const ModalContent = styled('div')(() => ({
    backgroundColor: 'white',
    margin: '10%',
    padding: '20px',
    width: '50%',
}));
const StyledField = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing['4'],
}));
const StyledColumnItem = styled('div')(() => ({
    display: 'flex',
}));

// FUNCTIONS
const changeColumnName = (
    id,
    tableName,
    originalColumnName,
    newColumnName,
    monolithStore,
    notification,
): boolean => {
    // clean structure names
    if (/\s/.test(tableName)) {
        tableName = tableName.replace(' ', '_');
    }
    if (/\s/.test(originalColumnName)) {
        originalColumnName = originalColumnName.replace(' ', '_');
    }
    if (/\s/.test(newColumnName)) {
        newColumnName = newColumnName.replace(' ', '_');
    }

    const pixelString = `DatabaseRenameColumn( database=[ "${id}" ], concept=["${tableName}"], column=["${originalColumnName}"], newValue=["${newColumnName}"]);`;
    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully changed column name from ${originalColumnName}, to ${newColumnName}`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
        return success;
    });

    return success;
};

const changeColumnType = (
    id,
    tableName,
    columnName,
    newColumnType,
    monolithStore,
    notification,
): boolean => {
    if (/\s/.test(tableName)) {
        tableName = tableName.replace(' ', '_');
    }
    if (/\s/.test(columnName)) {
        columnName = columnName.replace(' ', '_');
    }
    if (/\s/.test(newColumnType)) {
        newColumnType = newColumnType.replace(' ', '_');
    }

    // `EditDatabasePropertyDataType( database=[${JSON.stringify(databaseId)}], concept=[${JSON.stringify(concept)}], column=[${JSON.stringify(column)}], dataType=[${JSON.stringify(dataType)}] );`;
    const pixelString = `EditDatabasePropertyDataType( database=[ "${id}" ], concept=[${JSON.stringify(
        tableName,
    )}], column=[${JSON.stringify(columnName)}], dataType=[${JSON.stringify(
        newColumnType,
    )}]);`;
    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully changed ${columnName}'s type to ${newColumnType}`,
            });

            return true;
        } else {
            notification.add({
                color: 'error',
                content: output,
            });
            return false;
        }
        return success;
    });

    return success;
};

export const EditColumnModal = ({
    id,
    openEditColumnModal,
    setOpenEditColumnModal,
    column,
    updateState,
}) => {
    const {
        table,
        columnName,
        columnDescription,
        columnType,
        columnDefaultValue,
        columnNotNull,
        columnIsPrimary,
    } = column;

    const { monolithStore } = useRootStore();
    // notification service
    const notification = useNotification();

    // const [showModal, setShowModal] = useState(false);

    const { control, watch, setValue, register, handleSubmit } = useForm<{
        TABLE_NAME: string;
        TABLE_ID: string;
        COLUMN_NAME: string;
        COLUMN_TYPE: string;
        COLUMN_DESCRIPTION: string;
        COLUMN_DEFAULT_VALUE: any;
        COLUMN_NOT_NULL: boolean;
        COLUMN_IS_PRIMARY: boolean;
    }>({
        defaultValues: {
            TABLE_NAME: table.name,
            TABLE_ID: table.id,
            COLUMN_NAME: columnName,
            COLUMN_TYPE: columnType,
            COLUMN_DESCRIPTION: columnDescription,
            COLUMN_DEFAULT_VALUE: columnDefaultValue,
            COLUMN_NOT_NULL: columnNotNull,
            COLUMN_IS_PRIMARY: columnIsPrimary,
        },
    });

    const tableName = watch('TABLE_NAME');
    const tableId = watch('TABLE_ID');
    const colName = watch('COLUMN_NAME');
    const colType = watch('COLUMN_TYPE');

    const onSubmit = async (data) => {
        let error = false;

        // handle changing the column type before the column name to avoid the need to conditionally choose which column name to pass in the case that the column name was also changed
        if (columnType !== colType) {
            const success = await changeColumnType(
                id,
                table.name,
                columnName,
                colType,
                monolithStore,
                notification,
            );
            if (!success) {
                error = true;
            }
        }

        if (columnName !== colName) {
            const success = await changeColumnName(
                id,
                table.name,
                columnName,
                colName,
                monolithStore,
                notification,
            );
            if (!success) {
                error = true;
            }
        }

        // should we keep the modal open if there was an error?
        if (error) {
            // keep modal open
        } else {
            // close modal
            setOpenEditColumnModal(false);
        }
        // onClose();
    };

    const handleSave = () => {
        // update state
        // test column update
        updateState(
            {
                table: { id: table.id, name: table.name },
                prevName: columnName,
                newName: colName,
                newType: colType,
            },
            'COLUMN_NAME_CHANGE',
        );
        setOpenEditColumnModal(false);
    };
    return (
        // <>
        //     <Button onClick={() => setShowModal(true)}>Edit Column</Button>
        //     {showModal && (
        //         <ModalContainer onClick={() => setShowModal(false)}>
        //             <ModalContent onClick={(e) => e.stopPropagation()}>
        //                 <Button onClick={() => setShowModal(false)}>
        //                     Hide Modal
        //                 </Button>
        //                 {children}
        //             </ModalContent>
        //         </ModalContainer>
        //     )}
        // </>
        <form onSubmit={handleSubmit(onSubmit)}>
            <Modal
                open={openEditColumnModal}
                onClose={() => setOpenEditColumnModal(false)}
                maxWidth={'md'}
            >
                <Modal.Title>Edit Column</Modal.Title>
                <Modal.Content>
                    <Stack spacing={3}>
                        <h3>Table: {table.name} </h3>
                        {/* <StyledColumnItem> */}
                        <StyledField>
                            <Controller
                                name={'COLUMN_NAME'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            required
                                            label="Column name"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                        />
                                    );
                                }}
                            />
                        </StyledField>
                        <StyledField>
                            <Controller
                                name={'COLUMN_DESCRIPTION'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextArea
                                            required
                                            label="Column description"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            rows={2}
                                        />
                                    );
                                }}
                            />
                        </StyledField>
                        <StyledField>
                            <Controller
                                name={'COLUMN_TYPE'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field, fieldState }) => {
                                    const hasError = fieldState.error;
                                    return (
                                        <Select
                                            label="Column Type"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                        >
                                            <Menu.Item value={'INT'}>
                                                INT
                                            </Menu.Item>
                                            <Menu.Item value={'DOUBLE'}>
                                                DOUBLE
                                            </Menu.Item>
                                            <Menu.Item value={'STRING'}>
                                                STRING
                                            </Menu.Item>
                                            <Menu.Item value={'BOOLEAN'}>
                                                BOOLEAN
                                            </Menu.Item>
                                            <Menu.Item value={'DATE'}>
                                                DATE
                                            </Menu.Item>
                                            <Menu.Item value={'TIMESTAMP'}>
                                                TIMESTAMP
                                            </Menu.Item>
                                        </Select>
                                    );
                                }}
                            />
                        </StyledField>
                        <StyledField>
                            <Controller
                                name={'COLUMN_DEFAULT_VALUE'}
                                control={control}
                                rules={{
                                    required: false,
                                }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label={'Column default value'}
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                        />
                                    );
                                }}
                            />
                        </StyledField>
                        <StyledField>
                            <Controller
                                name={'COLUMN_NOT_NULL'}
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <Checkbox
                                            label="Not Null?"
                                            checked={field.value}
                                            onChange={(value) =>
                                                field.onChange(!value)
                                            }
                                        />
                                    );
                                }}
                            />
                        </StyledField>
                        <StyledField>
                            <Controller
                                name={'COLUMN_IS_PRIMARY'}
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <Checkbox
                                            label="Primary Key?"
                                            checked={field.value}
                                            onChange={(value) =>
                                                field.onChange(!value)
                                            }
                                        />
                                    );
                                }}
                            />
                        </StyledField>
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleSubmit(onSubmit)}>
                        Submit Changes
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </Modal.Actions>
            </Modal>
        </form>
    );
};
