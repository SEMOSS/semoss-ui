import { useCallback } from 'react';
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
    /** Edges to render in the metamodel */
    edges?: Edge[];

    /** Track the selected node */
    selectedNode?: MetamodelNode | null;
    /** Function that is called when a new node is selected */
    onSelectNode: (selected: MetamodelNode | null) => void;

    /** callback to be sent for updates to metamodel */
    callback?: (data: any) => void;
}

export const Metamodel = (props: MetamodelProps) => {
    const {
        selectedNode = null,
        onSelectNode = () => null,
        nodes = [],
        edges = [],
        callback,
    } = props;

    debugger;
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
    };

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
            {callback && <Button>Import</Button>}
        </MetamodelContext.Provider>
    );
};
