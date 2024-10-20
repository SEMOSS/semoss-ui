import { useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button, styled } from '@semoss/ui';

import { MetamodelContext, MetamodelContextType } from '@/contexts';

import { MetamodelNode } from './MetamodelNode';
import { FloatingEdge } from './FloatingEdge';

const StyledMetamodelPage = styled('div')(() => ({
    display: 'flex',
    width: '1271px',
    height: '1032px',
    padding: 'var(--spacing-spacing-08, 40px) 0px 20px 0px',
    alignItems: 'flex-start',
    gap: 'var(--spacing-spacing-05, 16px)',
    flexShrink: 0,
}));
const StyledMetamodelContainer = styled('div')(() => ({
    display: 'flex',
    height: '785px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
    flexShrink: 0,
    alignSelf: 'stretch',
}));
const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

// const StyledReactFlowContainer = styled('div')(() => ({
// }));

const edgeTypes = {
    floating: FloatingEdge,
};

const nodeTypes = {
    metamodel: MetamodelNode,
};

export type MetamodelNode = Node<
    React.ComponentProps<typeof MetamodelNode>['data']
>;

interface MetamodelProps {
    /** Nodes to render in the metamodel */
    nodes?: MetamodelNode[];
    /** Edges (aka relationships) to render in the metamodel */
    edges?: Edge[];

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
        nodes = [],
        edges = [],
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

    const [originalData, setOriginalData] = useState({
        nodes: nodes,
        edges: edges,
    });
    const [data, setData] = useState({ nodes: nodes, edges: edges });

    const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState(nodes);
    const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges);

    // update when the props change
    useEffect(() => {
        setFlowNodes(nodes);
        setFlowEdges(edges);
    }, [nodes, edges]);

    const updateData = (nodeData, action) => {
        const temp = data;
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
            console.log('node: ', node);
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

    const onSelectNodeId = useCallback(
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
        [nodes],
    );

    return (
        <MetamodelContext.Provider
            value={{
                selectedNodeId: selectedNode ? selectedNode.id : null,
                onSelectNodeId: onSelectNodeId,
                isInteractive: isInteractive,
                updateData: updateData,
            }}
        >
            <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onFlowNodesChange}
                onEdgesChange={onFlowEdgesChange}
                fitView={true}
            >
                <MiniMap />
                <Controls showInteractive={false} />
            </ReactFlow>

            {callback && (
                <Button
                    onClick={() => {
                        onSubmit();
                    }}
                >
                    Apply
                </Button>
            )}
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
