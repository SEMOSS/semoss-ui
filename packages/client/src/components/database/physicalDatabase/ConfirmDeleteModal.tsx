import React, { useState, useEffect } from 'react';
import { Modal, styled, Button, Icon, useNotification } from '@semoss/ui';
import { select } from 'd3';

import { useRootStore, usePixel, useAPI, useDatabase } from '@/hooks';

const StyledModalActions = styled(Modal.Actions)(() => ({
    display: 'flex',
    justifyContent: 'center',
}));

const deleteStructureFunc = (
    id,
    selectedNode,
    dataToDelete,
    monolithStore,
    notification,
    onClose,
): Promise<boolean> => {
    const tableObj = {
        [selectedNode.data.name]: [],
    };

    if (dataToDelete.structureType === 'table') {
        selectedNode.data.properties.forEach((col) => {
            tableObj[selectedNode.data.name].push(col.name);
        });
    } else if (dataToDelete.structureType === 'column') {
        tableObj[selectedNode.data.name].push(dataToDelete.structureName);
    }

    const pixelString = `DeleteDatabaseStructure(database=['${id}'],metamodelDelete=[${JSON.stringify(
        tableObj,
    )}])`;

    const success = monolithStore.runQuery(pixelString).then((response) => {
        const type = response.pixelReturn[0].operationType;
        const output = response.pixelReturn[0].output;
        if (type.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                content: `Successfully deleted ${dataToDelete.structureType} ${dataToDelete.structureName}`,
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

    // get the column names: selectedNode.data.properties is an array of column objects, with the column name being the value of the name key
    // loop over properties to push column names into the column name array
    // if table ... push all columns to delete the whole table
    // else if column ... push the specific column to only delete that column
    /**
     * metamodelDelete=[{tableName: [columnname1, columnname2, columnname3]}]
     */
};

export const ConfirmDeleteModal = ({
    id,
    openDeleteConfirmationModal,
    setOpenDeleteConfirmationModal,
    selectedNode,
    dataToDelete, // { structureId: string, structureName: string, structureType: string }
    onClose,
}) => {
    const { monolithStore } = useRootStore();
    // notification service
    const notification = useNotification();

    /** FUNCTION TO DELETE THE SELECTED TABLE */
    // Refactor to make reusable for other types of data structures... i.e. columns, dbs, tables, files, etc
    const deleteStructureHelper = async () => {
        const successfulDelete = await deleteStructureFunc(
            id,
            selectedNode,
            dataToDelete,
            monolithStore,
            notification,
            onClose,
        );

        if (!successfulDelete) {
            // keep modal open
        } else {
            setOpenDeleteConfirmationModal(false);
            // refresh?
        }
    };

    return (
        <Modal
            open={openDeleteConfirmationModal}
            onClose={() => {
                setOpenDeleteConfirmationModal(false);
            }}
        >
            <Modal.Content>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    This will immediately delete the{' '}
                    {dataToDelete.structureType}:{' '}
                    <b>{dataToDelete.structureName}</b>,{' '}
                    <b>this action is irreversible</b>.
                </Modal.Content>

                <StyledModalActions>
                    <Button
                        color={'grey'}
                        variant={'text'}
                        onClick={() => {
                            setOpenDeleteConfirmationModal(false);
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        color={'error'}
                        onClick={() => {
                            deleteStructureHelper();
                        }}
                    >
                        Delete {dataToDelete.structureType}
                    </Button>
                </StyledModalActions>
            </Modal.Content>
        </Modal>
    );
};
