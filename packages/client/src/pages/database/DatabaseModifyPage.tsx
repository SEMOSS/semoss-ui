import React, { useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { usePixel, useDatabase } from '@/hooks';
import { theme } from '@/theme';
import {
    styled,
    Select,
    Table,
    Scroll,
    Icon,
    Pill,
    Form,
    Select,
    Button,
    Modal,
} from '@semoss/ui';
import { Metamodel, MetamodelNode } from '@/components/metamodel';
import {
    AddTableModal,
    EditTableModal,
    DeleteTableModal,
    ConfirmDeleteModal,
    ColumnDetails,
    EditColumnModal,
} from '@/components/database/physicalDatabase';

import { mdiPlus } from '@mdi/js';

const StyledMetamodelContainer = styled('div')(() => ({
    height: '55vh',
    width: '100%',
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
}));
const StyledActionBtnContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: '40px',
    width: '60%',
    marginBottom: '9px',
}));
const StyledTypeahead = styled(Select)(() => ({
    height: '40px',
    width: '50%',
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
}));

// const StyledButtonContainer = styled('div', {
//     position: 'relative',
// });
// const StyledButton = styled(Button, {
//     height: '40%',
//     width: '40%',
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
// });

export const DatabaseModifyPage = observer(() => {
    const { id } = useDatabase();

    // track the selected node
    const [selectedNode, setSelectedNode] =
        useState<React.ComponentProps<typeof Metamodel>['selectedNode']>(null);

    const [tableOptions, setTableOptions] = useState([]);
    const [openAddTableModal, setOpenAddTableModal] = useState(false);
    const [openDeleteTableModal, setOpenDeleteTableModal] = useState(false);
    const [openEditTableModal, setOpenEditTableModal] = useState(false);
    const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] =
        useState(false);
    const [dataToDelete, setDataToDelete] = useState({
        structureId: '',
        structureName: '',
        structureType: '',
    });
    const [tableToEdit, setTableToEdit] = useState({
        tableId: '',
        tableName: '',
        tableDescription: '',
        columns: [],
    });
    const [columnToEdit, setColumnToEdit] = useState({
        tableId: '',
        tableName: '',
        columnName: '',
        columnDescription: '',
        columnType: '',
        columnDefaultValue: '',
        columnNotNull: false,
        columnIsPrimary: false,
    });
    const [openEditColumnModal, setOpenEditColumnModal] = useState(false);
    const [databaseUpdated, setDatabaseUpdated] = useState(false);

    // get the metadata
    const getDatabaseMetamodel = usePixel<{
        dataTypes: Record<string, 'INT' | 'DOUBLE' | 'STRING'>;
        logicalNames: Record<string, string[]>;
        nodes: { propSet: string[]; conceptualName: string }[];
        edges: {
            sourceColumn?: string;
            targetColumn?: string;
            relation: string;
            source: string;
            target: string;
        }[];
        physicalTypes: Record<string, string>;
        positions: Record<
            string,
            {
                top: number;
                left: number;
            }
        >;
        descriptions: Record<string, string>;
        additionalDataTypes: Record<string, 'INT' | 'FLOAT' | 'VARCHAR(2000)'>;
    }>(
        `GetDatabaseMetamodel( database=["${id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"]); `,
    );

    // get the data if a table is selected
    const getData = usePixel<{
        data: {
            values: (string | number | boolean)[][];
            headers: string[];
        };
        headerInfo: {
            dataType: string;
            additionalDataType: string;
            alias: string;
            header: string;
            type: string;
            derived: boolean;
        }[];
        numCollected: number;
    }>(
        selectedNode && selectedNode.data.properties.length > 0
            ? `Database(database=["${id}"]) | Select(${selectedNode.data.properties
                  .map((p) => p.id)
                  .join(', ')}) | Collect(100);`
            : '',
        {
            data: {
                data: {
                    values: [],
                    headers: [],
                },
                headerInfo: [],
                numCollected: 0,
            },
        },
    );

    // format the nodes
    const nodes: React.ComponentProps<typeof Metamodel>['nodes'] =
        useMemo(() => {
            if (getDatabaseMetamodel.status !== 'SUCCESS') {
                return [];
            }

            // extract the required information
            const {
                nodes = [],
                positions = {},
                dataTypes = {},
            } = getDatabaseMetamodel.data;

            return nodes.map((n, i) => {
                const node = n.conceptualName;

                return {
                    id: node,
                    type: 'metamodel',
                    data: {
                        name: String(n.conceptualName).replace(/_/g, ' '),
                        properties: n.propSet.map((p) => {
                            const property = `${node}__${p}`;
                            // create data type
                            const dataType = dataTypes[property];

                            return {
                                id: property,
                                name: String(p).replace(/_/g, ' '),
                                type: dataType,
                            };
                        }),
                        isInteractive: true,
                        setOpenDeleteConfirmationModal:
                            setOpenDeleteConfirmationModal,
                        setDataToDelete: setDataToDelete,
                        setOpenEditTableModal: setOpenEditTableModal,
                        setTableToEdit: setTableToEdit,
                        setColumnToEdit: setColumnToEdit,
                        setOpenEditColumnModal: setOpenEditColumnModal,
                    },
                    position: positions[node]
                        ? {
                              x: positions[node].left,
                              y: positions[node].top,
                          }
                        : {
                              x: 0,
                              y: 0,
                          },
                };
            });
        }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    // build out object with name as key
    const nodeOptionsObj = {};
    nodes.forEach((node) => (nodeOptionsObj[node.data.name] = node));

    // format the edges
    const edges: React.ComponentProps<typeof Metamodel>['edges'] =
        useMemo(() => {
            if (getDatabaseMetamodel.status !== 'SUCCESS') {
                return [];
            }
            const data = getDatabaseMetamodel.data;

            return data.edges.map((e) => {
                return {
                    id: e.relation,
                    type: 'floating',
                    source: e.source,
                    target: e.target,
                };
            });
        }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    // console.log('getDatabaseMetamodel is: ', getDatabaseMetamodel); // { data: { nodes: [ table1, table2, table3 ..]}}

    // create table options from the getDatabaseMetamodel...

    // each node in the nodes array represents a table, the table object has a conceptualName (table name) property and a propSet (columns) property

    // selectedNode is an object representation of the selected table 'image'
    // name -> table name
    // properties -> columns

    // GET LIST OF TABLES

    // Prepend the property, deleteTable: false, to each TABLE in the LIST OF TABLES

    // set this new list of tables to be the value of tableOptions

    // the state will be passed into the deleteTable modal

    return (
        <div>
            <StyledActionBtnContainer>
                <StyledTypeahead
                    options={Object.keys(nodeOptionsObj)}
                    placeholder="search for table"
                    onChange={(e) => setSelectedNode(nodeOptionsObj[e])}
                />
                {/* <Button
                    variant={'text'}
                    onClick={() => setOpenAddTableModal(true)}
                >
                    <Icon path={mdiPlus} size={2} />
                </Button> */}
                {/* <Button>Edit</Button> */}
                <Button onClick={() => setOpenAddTableModal(true)}>Add</Button>
                <Button onClick={() => setOpenDeleteTableModal(true)}>
                    Delete
                </Button>
            </StyledActionBtnContainer>
            <AddTableModal
                id={id}
                openAddTableModal={openAddTableModal}
                setOpenAddTableModal={setOpenAddTableModal}
                onClose={() => {
                    setDatabaseUpdated(true);
                    setSelectedNode(null);
                }}
                getDatabaseMetamodel={getDatabaseMetamodel}
            />
            <DeleteTableModal
                id={'123abc'}
                openDeleteTableModal={openDeleteTableModal}
                setOpenDeleteTableModal={setOpenDeleteTableModal}
                tableOptions={[]}
            />
            {/* <EditColumnModal>
                <ColumnDetails
                    column={{
                        table: 'test',
                        columnName: 'test',
                        columnDescription: 'test',
                        columnType: 'type',
                        columnDefaultValue: 'empty',
                        columnNotNull: false,
                        columnIsPrimary: true,
                    }}
                />
            </EditColumnModal> */}
            {selectedNode !== null && openEditTableModal && (
                <EditTableModal
                    id={id}
                    tableData={tableToEdit}
                    openEditTableModal={openEditTableModal}
                    setOpenEditTableModal={setOpenEditTableModal}
                />
            )}
            {selectedNode !== null && openEditColumnModal && (
                <EditColumnModal
                    id={id}
                    openEditColumnModal={openEditColumnModal}
                    setOpenEditColumnModal={setOpenEditColumnModal}
                    column={columnToEdit}
                />
            )}
            {selectedNode !== null && openDeleteConfirmationModal && (
                <ConfirmDeleteModal
                    id={id}
                    openDeleteConfirmationModal={openDeleteConfirmationModal}
                    setOpenDeleteConfirmationModal={
                        setOpenDeleteConfirmationModal
                    }
                    selectedNode={selectedNode}
                    dataToDelete={dataToDelete}
                    onClose={() => {
                        setOpenDeleteConfirmationModal(false);
                        setSelectedNode(null);
                    }}
                />
            )}
            <div>
                <StyledMetamodelContainer>
                    <Metamodel
                        nodes={nodes}
                        edges={edges}
                        selectedNode={selectedNode}
                        onSelectNode={(n) => {
                            setSelectedNode(n);
                        }}
                        // isInteractive={true}
                        // setOpenDeleteConfirmationModal={
                        //     setOpenDeleteConfirmationModal
                        // }
                    />
                </StyledMetamodelContainer>
            </div>
            {/* <StyledButtonContainer> */}
            {/* <StyledButton
                // variant={'text'}
                onClick={() => setOpenAddTableModal(true)}
            >
                <Icon path={mdiPlus} size={'lg'} />
            </StyledButton> */}
            {/* </StyledButtonContainer> */}
        </div>
    );
});
