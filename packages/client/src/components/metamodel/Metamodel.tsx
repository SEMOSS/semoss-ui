import { useCallback, useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Node, Edge } from 'react-flow-renderer';
import { Button } from '@semoss/ui';
import { MetamodelNode } from './MetamodelNode';
import { FloatingEdge } from './FloatingEdge';
import { MetamodelContext, MetamodelContextType } from '@/contexts';

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
    console.log('props: ', props);

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
        if (action === 'TABLE_NAME_CHANGE') {
        }

        if (action === 'TABLE_RELATIONSHIP_CHANGE') {
        }
        // if action === 'column data type change'
    };

    console.log('originalData: ', originalData);
    console.log('data: ', data);
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
                console.log('node: ', node);
                console.log('onSelectNode func: ', onSelectNode);

                onSelectNode(node);
            },
            [nodes],
        ),
        isInteractive: isInteractive,
        updateData: updateData,
    };

    const onSubmit = () => {
        // format the data
        const dataObj = {
            metamodel: { relation: [], nodeProp: {} },
            dataTypeMap: {},
        };

        // loop over data state

        // build metamodel relation for each table
        for (const edge of data.edges) {
            const relName = `${edge.source}_${edge.target}`;
            dataObj.metamodel.relation.push({
                relName: relName,
                toTable: edge.target,
                fromTable: edge.source,
            });
        }

        // build metamodel node prop

        // build dataTypeMap for each table
        for (const node of data.nodes) {
            // const temp = { [node.data.name]: [] };
            const temp = [];
            for (const col of node.data.properties) {
                dataObj.dataTypeMap[col.name] = col.type;
                // temp[node.data.name].push(col.name);
                temp.push(col.name);
            }

            dataObj.metamodel.nodeProp[node.data.name] = temp;
        }

        console.log('dataObj: ', dataObj);
        callback(dataObj);
    };

    useEffect(() => {
        console.log('data changed: ', data);
    }, [data]);

    return (
        <MetamodelContext.Provider value={metamodelContext}>
            <ReactFlow
                defaultNodes={nodes}
                defaultEdges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
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
