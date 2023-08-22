import React, { useState, useEffect } from 'react';
import {
    Modal,
    styled,
    Button,
    Table,
    Radio,
    Icon,
    useNotification,
    Stack,
    TextField,
    TextArea,
    Checkbox,
} from '@semoss/ui';

import { useForm, Controller } from 'react-hook-form';
import { useRootStore } from '@/hooks';

import { MetamodelContext, MetamodelContextType } from '@/contexts';

export const EditTableModal = ({
    id,
    openEditTableModal,
    setOpenEditTableModal,
    tableData,
}) => {
    /** EDIT TABLE MODAL COMPONENT
     *
     *
     * functionality:
     *  1. Table:
     *             A. edit name
     *             B. edit logical name
     *             C. edit description
     *  2. Column:
     *             A. edit name
     *             B. edit logical name?
     *             C. set as foreign key
     *                  if foreign key, then select the reference/target table and column. And set the relationship type.
     *             D. set as primary key
     *             E. allow null
     *             F. set default value
     *             G. column description?
     *
     */

    console.log('tableData: ', tableData);

    /**
     * tableData: {
     *      name: 'tablename',
     *      properties: [
     *              {
     *                id: 'col_name_underscored',
     *                name: 'col name spaced',
     *                type: 'col type'
     *              }
     *      ]
     *
     * }
     */

    const { monolithStore } = useRootStore();

    const notification = useNotification();

    const { control, watch, handleSubmit } = useForm<{
        TABLE_NAME: string;
        TABLE_ID: string;
        TABLE_DESCRIPTION: string;
    }>({
        defaultValues: {
            TABLE_NAME: '',
            TABLE_ID: '',
            TABLE_DESCRIPTION: '',
        },
    });

    const tableName = watch('TABLE_NAME');
    const tableId = watch('TABLE_ID');
    const tableDescription = watch('TABLE_DESCRIPTION');

    return (
        <form>
            <Modal open={openEditTableModal} maxWidth="md">
                <Modal.Title>Edit Table</Modal.Title>
                <Modal.Content>
                    <Stack spacing={3}>
                        <h3>Table</h3>
                        <div>
                            <Controller
                                name="TABLE_NAME"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            required
                                            label="Table name"
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
                        </div>
                    </Stack>
                    {/* <Table>
                    <Table.Body>

                    </Table.Body>
                </Table> */}
                </Modal.Content>
                <Modal.Actions>
                    <Button>Save Changes</Button>
                </Modal.Actions>
            </Modal>
        </form>
    );
};
