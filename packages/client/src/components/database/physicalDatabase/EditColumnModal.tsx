import React, { useState } from 'react';
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

import { useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';
import { tree } from 'd3';

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
const StyledField = styled('div')(() => ({
    marginBottom: theme.space['4'],
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
        COLUMN_NAME: string;
        COLUMN_TYPE: string;
        COLUMN_DESCRIPTION: string;
        COLUMN_DEFAULT_VALUE: any;
        COLUMN_NOT_NULL: boolean;
        COLUMN_IS_PRIMARY: boolean;
    }>({
        defaultValues: {
            TABLE_NAME: table.name,
            COLUMN_NAME: columnName,
            COLUMN_TYPE: columnType,
            COLUMN_DESCRIPTION: columnDescription,
            COLUMN_DEFAULT_VALUE: columnDefaultValue,
            COLUMN_NOT_NULL: columnNotNull,
            COLUMN_IS_PRIMARY: columnIsPrimary,
        },
    });

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
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Modal
                open={openEditColumnModal}
                onClose={() => setOpenEditColumnModal(false)}
            >
                <Modal.Content size={'md'}>
                    <Modal.Title>Edit Column</Modal.Title>
                    <Modal.Content>
                        <>
                            <h3>Table: {table.name} </h3>
                            {/* <StyledColumnItem> */}
                            <StyledField>
                                <TextField
                                    name={'COLUMN_NAME'}
                                    label={'Column name'}
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Enter column name',
                                        size: 'md',
                                    }}
                                    error="Column name is required"
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'COLUMN_DESCRIPTION'}
                                    label={'Column description'}
                                    control={control}
                                    rules={{
                                        required: false,
                                    }}
                                    options={{
                                        component: 'textarea',
                                        placeholder: 'Enter column description',
                                        size: 'md',
                                    }}
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'COLUMN_TYPE'}
                                    label={'Column type'}
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    options={{
                                        component: 'select',
                                        placeholder: 'Enter column type',
                                        options: [
                                            'INT',
                                            'DOUBLE',
                                            'STRING',
                                            'BOOLEAN',
                                            'DATE',
                                            'TIMESTAMP',
                                        ],
                                        size: 'md',
                                    }}
                                    error="Column must have a type"
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'COLUMN_DEFAULT_VALUE'}
                                    label={'Column default value'}
                                    control={control}
                                    rules={{
                                        required: false,
                                    }}
                                    options={{
                                        component: 'input',
                                        placeholder:
                                            'Enter column default value',
                                        size: 'md',
                                    }}
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'COLUMN_NOT_NULL'}
                                    label={'Not Null?'}
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'checkbox',
                                    }}
                                    description=""
                                ></TextField>
                            </StyledField>
                            <StyledField>
                                <TextField
                                    name={'COLUMN_IS_PRIMARY'}
                                    label={'Primary Key?'}
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'checkbox',
                                    }}
                                    description=""
                                ></TextField>
                            </StyledField>
                            {/* </StyledColumnItem> */}
                        </>
                    </Modal.Content>
                    <Button onClick={handleSubmit(onSubmit)}>
                        Submit Changes
                    </Button>
                </Modal.Content>
            </Modal>
        </Form>
    );
};
