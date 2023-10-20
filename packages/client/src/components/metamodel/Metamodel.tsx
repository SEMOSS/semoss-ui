import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Node,
    Edge,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
} from 'react-flow-renderer';
import Panel from 'react-flow-renderer';
import { Button, styled } from '@semoss/ui';
import { MetamodelNode } from './MetamodelNode';
import { FloatingEdge } from './FloatingEdge';
import { MetamodelContext, MetamodelContextType } from '@/contexts';

import { MetamodelToolbar } from './MetamodelToolbar';
import { format } from 'path';
import { MetamodelNav } from './MetamodelNav';
import { MetamodelEditMenu } from './MetamodelEditMenu';

const edgeTypes = {
    floating: FloatingEdge,
};

const nodeTypes = {
    metamodel: MetamodelNode,
};

export type MetamodelNode = Node<
    React.ComponentProps<typeof MetamodelNode>['data']
>;

interface FormattedNode extends MetamodelNode {
    nodeIndex?: number;
}

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

    /** number to track width of the metamodel nav component to adjust styling/width of the react-flow component */
    navWidth?: any;
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
    const [navWidth, setNavWidth] = useState(4.12);

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
    const formattedNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        const tempNode: FormattedNode = nodes[i];
        tempNode.nodeIndex = i;
        formattedNodes.push(tempNode as any);
    }

    const [originalData, setOriginalData] = useState({
        nodes: nodes,
        edges: edges,
    });
    const [data, setData] = useState({ nodes: nodes, edges: edges });

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
            [nodes],
        ),
        isInteractive: isInteractive,
        updateData: updateData,
        navWidth: navWidth, // track width of the metamodelNav component
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
            for (const col of node.data.properties) {
                payloadObj.dataTypeMap[col.name] = col.type;
            }

            payloadObj.metamodel.nodeProp[node.data.name] = [];
        }
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
        background: theme.palette.primary.main,
        color: 'var(--light-primary-contrast, #FFF)',
    }));

    /** Need to make the state of the nav (open/closed) available to this Metamodel component to determine width of the reactflow */
    const reactFlowWidth = 100 - navWidth;

    return (
        <>
            <MetamodelContext.Provider value={metamodelContext}>
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        // justifyContent: 'space-between',
                        gap: '60px',
                        marginTop: '16px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            height: '70vh',
                            width: '100%',
                            // justifyContent: 'space-between',
                            // marginBottom: '16px',
                        }}
                    >
                        <div
                            style={{
                                width: `${navWidth}%`,
                                height: '100%',
                            }}
                        >
                            <MetamodelNav
                                setNavWidth={setNavWidth}
                                nodes={formattedNodes}
                            />
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                width: `${reactFlowWidth}%`,
                                minWidth: `${reactFlowWidth}%`,
                                height: '100%',
                                marginLeft: '10px',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '0',
                                    minWidth: '100%',
                                    height: '100%',
                                    overflow: 'auto',
                                }}
                            >
                                <ReactFlow
                                    defaultNodes={formattedNodes}
                                    defaultEdges={edges}
                                    nodeTypes={nodeTypes}
                                    edgeTypes={edgeTypes}
                                    // defaultPosition={[-300, 0]}
                                    fitView={true}
                                >
                                    <Background
                                        variant={BackgroundVariant.Dots}
                                    />
                                    <MiniMap nodeStrokeWidth={3} />
                                    <Controls />
                                </ReactFlow>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            width: '100%',
                            // marginTop: '20px',
                            // marginBottom: '20px',
                        }}
                    >
                        <MetamodelEditMenu
                            nodeData={
                                selectedNode ? selectedNode : formattedNodes[0]
                            }
                        />
                    </div>
                </div>
            </MetamodelContext.Provider>
        </>
    );
};
