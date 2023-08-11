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
    TextField,
} from '@semoss/ui';

import { mdiDelete } from '@mdi/js';

import { useForm, useFieldArray } from 'react-hook-form';

import { useRootStore, usePixel, useAPI } from '@/hooks';

const StyledField = styled('div')(() => ({
    marginBottom: theme.space['4'],
}));

const StyledModalActions = styled(Modal.Actions)(() => ({
    display: 'flex',
    justifyContent: 'center',
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

const deleteTable = () => {
    /**
     * metamodelDeletions=[{tableName: [columnname1, columnname2, columnname3]}]
     */
};

export const DeleteTableModal = ({
    id,
    openDeleteTableModal,
    setOpenDeleteTableModal,
    tableOptions,
}) => {
    // const [tableOptions, setTableOptions] = useState([]);

    // make call on first load to get the tables available... or pass in the tables
    // map over and append property: deleteTable: false , to each table object
    const mockTableOptions = [
        {
            deleteTable: false,
            name: 'test1',
            id: '123',
            owner: 'userid',
            dateCreated: 'date',
            lastModified: 'date',
            dataSize: '100GB',
        },
        {
            deleteTable: false,
            name: 'test2',
            id: '1234',
            owner: 'userid2',
            dateCreated: 'date',
            lastModified: 'date',
            dataSize: '100GB',
        },
        {
            deleteTable: false,
            name: 'test3',
            id: '567',
            owner: 'userid3',
            dateCreated: 'date',
            lastModified: 'date',
            dataSize: '20GB',
        },
    ];
    const preparedTableOptions = mockTableOptions.map((tableObj, idx) => {
        const newTableObj = tableObj;
        newTableObj.deleteTable = false;
        return newTableObj;
    });

    const { control, watch, register, handleSubmit } = useForm<{
        TABLES: {
            deleteTable: boolean;
            id: string;
            name: string;
            owner: string;
            dateCreated: string;
            lastModified: string;
            dateSize: string;
        }[];
        TABLES_TO_DELETE: any[];
    }>({
        defaultValues: {
            TABLES: preparedTableOptions,
            TABLES_TO_DELETE: [],
        },
    });

    const tables = watch('TABLES');

    const { fields } = useFieldArray({
        name: 'TABLES_TO_DELETE', // tracks tables to delete that have been checked
        control,
    });

    // onSubmit function: loop over data... for any table that has deleteTable value marked true, add to pixel call
    // potential refactor: move data to TABLES_TO_DELETE on checkbox click. But for now, this seems to be simple and intuitive.
    const onSubmit = (data) => {
        console.log('data is: ', data);
        const TablesToDelete = {};

        for (const table of tables) {
            if (table.deleteTable === true) {
                TablesToDelete[table.name] = table;
            }
        }

        console.log('TablesToDelete: ', TablesToDelete);
        // FORM PIXEL TO DELETE THESE TABLES FROM THE DB
    };

    return (
        <Form>
            <Modal
                open={openDeleteTableModal}
                onClose={() => setOpenDeleteTableModal(false)}
            >
                <Modal.Content size={'lg'}>
                    <Modal.Title> Delete Tables </Modal.Title>
                    <Modal.Content>
                        <>
                            <StyledField>
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell>
                                                Delete Table
                                            </Table.Cell>
                                            <Table.Cell>id</Table.Cell>
                                            <Table.Cell>name</Table.Cell>
                                            <Table.Cell>owner</Table.Cell>
                                            <Table.Cell>
                                                date created
                                            </Table.Cell>
                                            <Table.Cell>
                                                date last modified
                                            </Table.Cell>
                                            <Table.Cell>data size</Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {tables.map((table, idx) => {
                                            return (
                                                <Table.Row key={idx}>
                                                    {Object.keys(table).map(
                                                        (key, keyIdx) => {
                                                            if (
                                                                key ===
                                                                'deleteTable'
                                                            ) {
                                                                return (
                                                                    <StyledCell
                                                                        key={`${key}_${keyIdx}`}
                                                                    >
                                                                        <StyledCellContent>
                                                                            <TextField
                                                                                name={`TABLES.${idx}.deleteTable`}
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
                                                                                        'Delete Table',
                                                                                    );
                                                                                }}
                                                                            ></TextField>
                                                                        </StyledCellContent>
                                                                    </StyledCell>
                                                                );
                                                            }
                                                            return (
                                                                <StyledCell
                                                                    key={`${key}_${keyIdx}`}
                                                                >
                                                                    <StyledCellContent>
                                                                        {
                                                                            table[
                                                                                key
                                                                            ]
                                                                        }
                                                                    </StyledCellContent>
                                                                </StyledCell>
                                                            );
                                                        },
                                                    )}
                                                </Table.Row>
                                            );
                                        })}
                                    </Table.Body>
                                </Table>
                            </StyledField>
                        </>
                    </Modal.Content>
                    <StyledModalActions>
                        <Modal.Actions>
                            <Button
                                color={'grey'}
                                variant="text"
                                onClick={() => setOpenDeleteTableModal(false)}
                            >
                                Close
                            </Button>

                            <Button
                                color={'success'}
                                onClick={handleSubmit(onSubmit)}
                            >
                                Submit
                            </Button>
                        </Modal.Actions>
                    </StyledModalActions>
                </Modal.Content>
            </Modal>
        </Form>
    );
};
