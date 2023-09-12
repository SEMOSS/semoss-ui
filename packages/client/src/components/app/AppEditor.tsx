import React, { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';

import { TreeView, useNotification, styled } from '@semoss/ui';

interface AppEditorProps {
    /**
     * Id of App to get Directory
     */
    appId: string;
}

interface NodeInterface {
    id: string;
    lastModified: string;
    name: string;
    path: string;
    type: string;
    children?: unknown;
}
export const AppEditor = (props: AppEditorProps) => {
    const { appId } = props;
    const { monolithStore, configStore } = useRootStore();

    const [appDirectory, setAppDirectory] = useState([]);
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    useEffect(() => {
        getInitialAppStructure();
    }, []);

    /**
     * Get the App Structure, first on mount
     * TODO*** Decide when i went to call this and how often (reusability)
     */
    const getInitialAppStructure = async () => {
        const pixel = `BrowseAsset(filePath=["version/assets"], space=["${appId}"]);`;
        // const pixel = `BrowseAsset(filePath=[], space=["${appId}"]);`;

        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        // TODO: Error Handle
        // debugger;

        const formattedNodes = [];

        output.forEach((node, i) => {
            const nodeWithID = {
                ...node,
                id: node.path,
            };
            if (node.type === 'directory') {
                formattedNodes.push({
                    ...nodeWithID,
                    children: [
                        {
                            id: `${node.path}/${i}`,
                            lastModified: '',
                            name: '',
                            path: '',
                            type: '',
                        },
                    ],
                });
            } else {
                formattedNodes.push(nodeWithID);
            }
        });

        setAppDirectory(formattedNodes);
    };

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    /**
     * selected node in App Directory (select in state), then Browse Particular Asset Project.
     * @param event
     * @param nodeIds
     */
    const handleSelect = async (
        event: React.SyntheticEvent,
        nodeIds: string[], // node-0-1-2
    ) => {
        const foundNode = findNodeById(appDirectory, nodeIds[0]);

        let pixel = '',
            selectionType = 'asset';

        if (foundNode.type === 'directory') {
            pixel += `BrowseAsset(filePath=["${foundNode.path}"], space=["${appId}"]);`;
            selectionType = 'directory';
        } else {
            // debugger;
            pixel += `GetAsset()`;
        }

        const response = await monolithStore.runQuery(pixel);
        const folderContents = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        // TODO Error Handling

        if (selectionType === 'directory') {
            const newNodeChildren = [];

            folderContents.forEach((fc, i) => {
                newNodeChildren.push({
                    ...fc,
                    id: fc.path,
                    children:
                        fc.type !== 'directory'
                            ? undefined
                            : [
                                  {
                                      id: `${fc.apth}/${i}`,
                                      lastModified: '',
                                      name: '',
                                      path: '',
                                      type: '',
                                  },
                              ],
                });
            });

            const updatedTreeData = updateNodeRecursively(
                appDirectory,
                foundNode.id,
                {
                    ...foundNode,
                    children: newNodeChildren,
                },
            );

            setAppDirectory(updatedTreeData);
        } else {
            return;
        }

        // No issues set selected nodes for visual representation
        setSelected(nodeIds);
    };

    // ----------------------------
    // Node Helpers ---------------
    // ----------------------------
    /**
     * Recursive function to find a node by its ID
     */
    const findNodeById = (nodes, targetId) => {
        for (const node of nodes) {
            if (node.id === targetId) {
                return node; // Found the node with the specified ID
            }
            if (node.children && node.children.length > 0) {
                const foundNode = findNodeById(node.children, targetId);
                if (foundNode) {
                    return foundNode; // Found the node within children
                }
            }
        }
        return null; // Node with the specified ID not found in the subtree
    };

    const updateNodeRecursively = (nodes, targetId, updatedData) => {
        return nodes.map((node) => {
            if (node.id === targetId) {
                // Update the properties of the target node
                return { ...node, ...updatedData };
            } else if (node.children && node.children.length > 0) {
                // Recursively update child nodes
                return {
                    ...node,
                    children: updateNodeRecursively(
                        node.children,
                        targetId,
                        updatedData,
                    ),
                };
            }
            return node;
        });
    };

    // ----------------------------
    // Render Helpers -------------
    // ----------------------------

    /**
     * Recursively render Tree Nodes based on nodes children
     */
    function renderTreeNodes(nodes) {
        return nodes.map((node, i) => (
            <TreeView.Item key={node.id} nodeId={node.id} labelText={node.name}>
                {node.children && node.children.length > 0
                    ? renderTreeNodes(node.children)
                    : null}
            </TreeView.Item>
        ));
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <TreeView
                expanded={expanded}
                selected={selected}
                onNodeToggle={handleToggle}
                onNodeSelect={handleSelect}
                multiSelect
            >
                {renderTreeNodes(appDirectory)}
            </TreeView>
            <div>App Editor</div>
        </div>
    );
};
