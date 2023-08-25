import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Node,
    Edge,
    Background,
} from 'react-flow-renderer';

import { styled, Button } from '@semoss/ui';
import { MetamodelNode } from './MetamodelNode';
import { FloatingEdge } from './FloatingEdge';
import { MetamodelContext, MetamodelContextType } from '@/contexts';

import { MetamodelToolbar } from './MetamodelToolbar';
import { format } from 'path';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

// const StyledReactFlowContainer = styled('div')(() => ({
// }));

const edgeTypes = {
    floating: FloatingEdge,
};

const nodeTypes = {
    metamodel: MetamodelNode,
    // metamodelButtons: MetamodelButtonNode,
};

export type MetamodelNode = Node<
    React.ComponentProps<typeof MetamodelNode>['data']
>;

interface MetamodelProps {
    /** Nodes to render in the metamodel */
    nodes?: MetamodelNode[];
    /** Edges (aka relationships) to render in the metamodel */
    edges?: Edge[];

    /** Track the selected node by index */
    nodeIndex?: number;

    /** Track the selected node */
    selectedNode?: MetamodelNode | null;
    /** Function that is called when a new node is selected */
    onSelectNode?: (selected: MetamodelNode | null) => void;

    /** callback to be sent for updates to metamodel */
    callback?: (data: any) => void;

    /** boolean to determine if metamodel can be modified */
    isInteractive?: boolean;
}

// depending on the type of action, functionality will be different
// csvForm: full edit functionality
// connect: only relationship edit functionly
// regardless of functionality, will send back all data? allow the higher order component to determine what to use

// data to return in callback
// { nodes: [], edges: [] }

export const Metamodel = (props: MetamodelProps) => {
    const {
        selectedNode = null,
        onSelectNode = () => null,
        edges = [],
        nodes = [],
        callback,
        isInteractive,
    } = props;

    // node is {
    //     data: { name: 'table', properties: [{ id: 'colid', name: 'colname', type: 'coltype' }] },
    // id: 'table',
    // position: { x: 180, y: 179 },
    // type: 'metamodel'
    // };

    // edge is {
    //     id: 'tableFrom_tableTo',
    //     source: 'tableFrom',
    //     target: 'tableTo',
    //     type: 'floating'
    // };

    let formattedNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        const tempNode = nodes[i];
        tempNode.nodeIndex = i;
        formattedNodes.push(tempNode);
    }

    const [originalData, setOriginalData] = useState({
        nodes: formattedNodes,
        edges: edges,
    });
    const [data, setData] = useState({ nodes: formattedNodes, edges: edges });

    const updateData = (nodeData, action) => {
        const temp = data;
        // enables Select component's dropdown to open onClick
        // WITHOUT THIS OPTIONS IN THE SELECT COMPONENT WILL NOT BE
        if (action === 'edit_node') {
            selectedNode.draggable = false;
            selectedNode.className = 'nopan';
            return;
        }
        // if action === 'column name change'
        if (action === 'COLUMN_NAME_CHANGE') {
            // access data by nodeData.table.name
            for (const node of temp.nodes) {
                if (node.id === nodeData.table.id) {
                    // loop over properties
                    for (const col of node.data.properties) {
                        // find property name that matches nodeData.prevName
                        if (col.name === nodeData.prevName) {
                            // update property name to nodeData.newName
                            col.name = nodeData.newName;
                            col.id = nodeData.newName;
                            // setData
                            setData({ ...temp });
                        }
                    }
                }
            }
        }
        if (action === 'COLUMN_TYPE_CHANGE') {
            // handle column type change
        }
        if (action === 'COLUMN_DESCRIPTION_CHANGE') {
            // handle column type change
        }
        if (action === 'COLUMN_LOGICAL_NAME_CHANGE') {
            // handle column type change
        }

        if (action === 'TABLE_NAME_CHANGE') {
            // handle table name change
        }
        if (action === 'TABLE_DESCRIPTION_CHANGE') {
            // handle table relationship change
        }
        if (action === 'TABLE_RELATIONSHIP_CHANGE') {
            // handle table relationship change
        }
        if (action === 'TABLE_POSITION_CHANGE') {
            // handle table relationship change
        }
        // if action === 'column data type change'
    };

    // create the context
    const metamodelContext: MetamodelContextType = {
        selectedNodeId: selectedNode ? selectedNode.id : null,
        onSelectNodeId: useCallback(
            (id) => {
                let node = null;

                if (id) {
                    for (
                        let nodeIdx = 0, nodeLen = nodes.length;
                        nodeIdx < nodeLen;
                        nodeIdx++
                    ) {
                        const n = nodes[nodeIdx];
                        if (id === n.id) {
                            node = n;
                            break;
                        }
                    }
                }

                onSelectNode(node);
            },
            [formattedNodes],
        ),
        isInteractive: isInteractive,
        updateData: updateData,
    };

    const onSubmit = () => {
        const payloadObj = {
            metamodel: {
                relation: [
                    // { fromTable: 'id', toTable: 'Drug', relName: 'id_Drug' },
                ],
                nodeProp: {
                    // tableName: [ // 'colname' EXCLUDING THE FIRST COLUMN
                    // ],
                },
            },
            dataTypeMap: {
                // colName: type,
            },
            newHeaders: {}, // oldColName: newColName
            additionalDataTypes: {}, // colName: specificFormat
            descriptionMap: {}, // colName: description
            logicalNamesMap: {}, // colName/alias: logicalName
            position: [{}],
            nodes: data.nodes,
        };
        // // format the data
        // const dataObj = {
        //     metamodel: { relation: [], nodeProp: {} },
        //     dataTypeMap: {},
        // };

        // loop over data state

        // build metamodel relation for each table
        for (const edge of data.edges) {
            const relName = `${edge.source}_${edge.target}`;
            payloadObj.metamodel.relation.push({
                fromTable: edge.source,
                toTable: edge.target,
                relName: relName,
            });
        }

        // build metamodel node prop

        // build dataTypeMap for each table
        for (const node of data.nodes) {
            // const temp = { [node.data.name]: [] };
            // const temp = [];
            for (const col of node.data.properties) {
                payloadObj.dataTypeMap[col.name] = col.type;
                // temp[node.data.name].push(col.name);
                // if (idx === 0) {
                // no-op to skip pushing in the first column bc nodeProp does not accept the first column !!! Need to figure out why?
                // } else {
                // if (node.data.properties.length <= 1) {
                //     // no-op
                // } else {
                //     temp.push(col.name);
                // }
                // }
            }

            payloadObj.metamodel.nodeProp[node.data.name] = [];
        }

        // callback(payloadObj);
        callback(payloadObj);
    };

    const StyledImportButton = styled(Button)(({ theme }) => ({
        position: 'absolute',
        bottom: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.shape.borderRadiusLg,
        background: theme.palette.primary.main,
        color: 'var(--light-primary-contrast, #FFF)',
    }));

    return (
        <MetamodelContext.Provider value={metamodelContext}>
            <div style={{ height: '95%', width: '100%' }}>
                <ReactFlow
                    defaultNodes={formattedNodes}
                    defaultEdges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView={true}
                >
                    <Background variant="dots" />
                    <MiniMap />
                    <Controls />
                </ReactFlow>
                {/* <StyledImportButton variant="contained">
                    Import
                </StyledImportButton> */}
            </div>
            {/* {callback && (
                <Button
                    onClick={() => {
                        onSubmit();
                    }}
                >
                    Apply
                </Button>
            )} */}
        </MetamodelContext.Provider>
    );
};

/** CHANGES MADE:
 * made onSelectNode an option prop in MetamodelProps
 *  removed arg / prop in CSVForm calling Metamodel component bc it was null and caused error. And the function is not needed in the CSVForm
 *
 */

// OBSERVATION: metamodel in legacy gives the table a primary key column that matches the table name...
// dataType map needs to include the primary key for all tables
