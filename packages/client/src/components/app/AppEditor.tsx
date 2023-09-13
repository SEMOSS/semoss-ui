import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRootStore, useAPI } from '@/hooks';

import {
    Collapse,
    IconButton,
    TreeView,
    useNotification,
    styled,
    Typography,
} from '@semoss/ui';
import {
    ExpandMore,
    ChevronRight,
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
} from '@mui/icons-material/';

const StyledVertDivider = styled('div')(({ theme }) => ({
    width: theme.spacing(0.25),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'ew-resize',
    },
}));

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

    /**
     * EDITOR LAYOUT START OF CODE
     */

    const [openTreeView, setOpenTreeView] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState('5%');
    const [rightPanelWidth, setRightPanelWidth] = useState('95%');
    const ref = useRef<any>(null);

    // useEffect(() => {}, [openTreeView]);
    /**
     * TODO: fix resizing seems to be opposite
     * @param e
     * @returns
     */
    const handleHorizontalResize = (e) => {
        if (!ref.current) {
            return;
        }
        const containerReferenceWidth = ref.current.offsetWidth;

        const fileExplorerWidth =
            (containerReferenceWidth - e.clientX) / containerReferenceWidth;
        const newFileExplorerWidth = `${fileExplorerWidth * 100}%`;
        const newEditorWidth = `${
            (e.clientX / containerReferenceWidth) * 100
        }%`;

        debugger;
        if (fileExplorerWidth > 0.035) {
            setLeftPanelWidth(newFileExplorerWidth);
            setRightPanelWidth(newEditorWidth);
        }
    };

    /**
     * EDITOR LAYOUT END OF CODE
     */

    /**
     * FILE EXPLORER START OF CODE
     */
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

        const formattedDirectoryNodes = sortArrayOfObjects(
            formattedNodes,
            'type',
        );

        setAppDirectory(formattedDirectoryNodes);
    };

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    /**
     * Sorts the directory structure before putting into state.
     * @param arr
     * @param propertyName
     * @param order
     * @returns
     */
    const sortArrayOfObjects = (arr, propertyName) => {
        const sortedArr = arr.sort((a, b) => {
            if (
                a[propertyName] === 'directory' &&
                b[propertyName] !== 'directory'
            ) {
                return -1; // 'directory' comes before other types
            }
            if (
                a[propertyName] !== 'directory' &&
                b[propertyName] === 'directory'
            ) {
                return 1; // 'directory' comes before other types
            }
            if (a[propertyName] < b[propertyName]) {
                return -1;
            }
            if (a[propertyName] > b[propertyName]) {
                return 1;
            }
            return 0;
        });
        return sortedArr;
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

            const formattedDirectoryNodes = sortArrayOfObjects(
                newNodeChildren,
                'type',
            );

            const updatedTreeData = updateNodeRecursively(
                appDirectory,
                foundNode.id,
                {
                    ...foundNode,
                    children: formattedDirectoryNodes,
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
            <TreeView.Item key={node.id} nodeId={node.id} label={node.name}>
                {node.children && node.children.length > 0
                    ? renderTreeNodes(node.children)
                    : null}
            </TreeView.Item>
        ));
    }
    /**
     * FILE EXPLORER END OF CODE
     */

    /**
     * CODE EDITOR START OF CODE
     */

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                height: '100%',
                // border: 'solid green',
            }}
            ref={ref}
        >
            <div
                style={{
                    width: leftPanelWidth,
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        height: '100%',
                        // border: 'solid red'
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: '42px',
                            // border: 'solid green',
                        }}
                    >
                        {openTreeView ? (
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setLeftPanelWidth('5%');
                                    setRightPanelWidth('95%');
                                    setOpenTreeView(false);
                                }}
                            >
                                <KeyboardDoubleArrowLeft />
                            </IconButton>
                        ) : (
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setLeftPanelWidth('45%');
                                    setRightPanelWidth('50%');
                                    setOpenTreeView(true);
                                }}
                            >
                                <KeyboardDoubleArrowRight />
                            </IconButton>
                        )}
                    </div>

                    {openTreeView ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: 'calc(100% - 42px)',
                                // border: 'solid green',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '2px',
                                    marginLeft: '8px',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="h6">
                                    File Explorer
                                </Typography>
                            </div>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflowX: 'scroll',
                                }}
                            >
                                <TreeView
                                    sx={{ width: '100%' }}
                                    expanded={expanded}
                                    selected={selected}
                                    onNodeToggle={handleToggle}
                                    onNodeSelect={handleSelect}
                                    defaultCollapseIcon={<ExpandMore />}
                                    defaultExpandIcon={<ChevronRight />}
                                    multiSelect
                                >
                                    {renderTreeNodes(appDirectory)}
                                </TreeView>
                            </div>
                        </div>
                    ) : null}
                    <StyledVertDivider
                        onMouseDown={(e) => {
                            e.preventDefault();
                            window.addEventListener(
                                'mousemove',
                                handleHorizontalResize,
                            );
                            window.addEventListener('mouseup', () => {
                                window.removeEventListener(
                                    'mousemove',
                                    handleHorizontalResize,
                                );
                            });
                        }}
                    />
                </div>
            </div>
            {/* We need an active file to show editor */}
            <div
                style={{
                    width: rightPanelWidth,
                    // border: 'solid yellow',
                }}
            >
                App Editor
            </div>
        </div>
    );
};
