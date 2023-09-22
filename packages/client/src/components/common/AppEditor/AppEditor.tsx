import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { TextEditor, ControlledFile } from '../';

import {
    Button,
    Accordion,
    Collapse,
    IconButton,
    TreeView,
    Icon,
    Skeleton,
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

const StyledEditorPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.secondary.light,
}));

const StyledCollapseTrigger = styled('div')(({ theme }) => ({
    height: '100%',
    width: '42px',
    backgroundColor: theme.palette.secondary.main,
    zIndex: 9998,
}));

const StyledCollapse = styled(Collapse)(({ theme }) => ({
    zIndex: 9998,
    // display: 'flex',
    // flexDirection: 'column',
    // width: open ? 'calc(20% + 42px)' : '0%',
    // height: '100%',
    // border: 'solid',
}));

const StyledCollapseContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '250px',
    height: '100%',
    paddingLeft: theme.spacing(2),
    boxShadow: '5px 0 5px -2px rgba(0, 0, 0, 0.04)',
}));

const StyleAppExplorerHeader = styled('div')(({ theme }) => ({
    // border: 'solid green',
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingTop: '2px',
    alignItems: 'center',
}));

const CustomAccordionTrigger = styled('div')(({ theme }) => ({
    display: 'flex',
    // border: 'solid red',
    flexDirection: 'row',
    '&:hover': {
        cursor: 'pointer',
    },
    '&:focus': {
        cursor: 'pointer',
    },
}));

interface AppEditorProps {
    /**
     * Id of App to get Directory
     */
    appId: string;
    /**
     * On Save of edits in the text editor, I would use the hook no need for extra dependency
     */
    onSave: (success: boolean) => void;
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
    const { appId, onSave } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [openAppAssetsPanel, setOpenAppAssetsPanel] = useState(true);

    const [openAccordion, setOpenAccordion] = useState(['file']);

    /**
     * FILE EXPLORER START OF CODE
     */
    const [appDirectory, setAppDirectory] = useState([]);
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    // Props necessary for TextEditor component
    const [filesToView, setFilesToView] = useState([]);
    const [activeFileIndex, setActiveFileIndex] = useState(null);

    useEffect(() => {
        getInitialAppStructure();
    }, []);

    /**
     * Get the App Structure, first on mount
     * TODO*** Decide when i went to call this and how often (reusability)
     */
    const getInitialAppStructure = async () => {
        const pixel = `BrowseAsset(filePath=["version/assets"], space=["${appId}"]);`;

        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        // TODO: Error Handle
        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
            return false;
        }

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

    /**
     * Selected node in App Directory.
     * 1. Open folder or View File selected node
     * 2. Select in state for TreeView component
     * @param event
     * @param nodeIds
     */
    const handleSelect = async (
        event: React.SyntheticEvent,
        nodeIds: string[],
    ) => {
        // Gets the Selected Node in Tree View
        const foundNode = findNodeById(appDirectory, nodeIds[0]);

        let pixel = '',
            selectionType = 'asset';

        if (foundNode.type === 'directory') {
            pixel += `BrowseAsset(filePath=["${foundNode.path}"], space=["${appId}"]);`;
            selectionType = 'directory';
        } else {
            pixel += `GetAsset(filePath=["${foundNode.path}"], space=["${appId}"]);`;
        }

        const response = await monolithStore.runQuery(pixel);
        const folderContents = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: folderContents,
            });
            return false;
        }

        // Determine whether we need to populate text editor or not with selected node
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
            const fileToAdd = {
                id: foundNode.id,
                name: foundNode.name,
                original: folderContents,
                type: foundNode.type,
                active: true,
            };
            const newFiles = filesToView;
            let activeIndex = 0;

            // Track to see if file is already present
            if (!filesToView.length) {
                newFiles.push(fileToAdd);
            } else {
                let foundFile = false;

                filesToView.forEach((prevFile, i) => {
                    if (prevFile.id === foundNode.id) {
                        foundFile = true;
                        newFiles[i] = {
                            ...newFiles[i],
                            active: true,
                        };

                        activeIndex = i;
                    } else {
                        newFiles[i] = {
                            ...newFiles[i],
                            active: false,
                        };
                    }
                });

                if (!foundFile) {
                    newFiles.push(fileToAdd);
                    activeIndex = newFiles.length - 1;
                }
            }

            setFilesToView(newFiles);
            setActiveFileIndex(activeIndex);
        }

        // No issues with reactor, set selected nodes for visual representation
        setSelected(nodeIds);

        // return nodeIds;
    };

    /**
     * 1. Save the Application Asset with *Pixel*
     * 2. Commit the Application Asset with *Pixel*
     * 2. Refresh the Application/IFRAME view
     */
    const saveApplicationAsset = async (
        file: ControlledFile,
    ): Promise<boolean> => {
        console.warn('Saving App Asset with Pixel');
        const pixel = `
            SaveAsset(fileName=["${file.id}"], content=["<encode>${file.content}</encode>"], space=["${appId}"]); 
            CommitAsset(filePath=["${file.id}"], comment=["Hardcoded comment from the App Page editor"], space=["${appId}"])
        `;

        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType,
            outputTwo = response.pixelReturn[1].output,
            operationTypeTwo = response.pixelReturn[1].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
            return false;
        }

        if (operationTypeTwo.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: outputTwo,
            });
        }

        // Refreshes App Renderer
        onSave(true);

        // Visual Save in Text Editor
        return true;
    };

    /**
     * Accordion for Dependencies and Files
     */
    const handleAccordionChange = (type: 'dependency' | 'file') => {
        const newOpenAccords = openAccordion;
        if (openAccordion.indexOf(type) > -1) {
            //remove it from open accordions
        } else {
            newOpenAccords.push(type);
        }
        // debugger;
        setOpenAccordion(newOpenAccords);
    };

    /**
     * Sets Expanded Folders
     * @param event
     * @param nodeIds
     */
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

    // ----------------------------
    // Node Helpers ---------------
    // ----------------------------
    /**
     * Tree View
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

    /**
     * Tree View
     * @param nodes
     * @param targetId
     * @param updatedData
     * @returns
     */
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

    return (
        <StyledEditorPanel>
            {/* Collapse Trigger Container */}
            <StyledCollapseTrigger
                sx={{
                    boxShadow: !openAppAssetsPanel
                        ? '5px 0 5px -2px rgba(0, 0, 0, 0.04)'
                        : 'none',
                }}
            >
                {openAppAssetsPanel ? (
                    <IconButton
                        size="small"
                        onClick={() => {
                            setOpenAppAssetsPanel(false);
                        }}
                    >
                        <KeyboardDoubleArrowLeft />
                    </IconButton>
                ) : (
                    <IconButton
                        size="small"
                        onClick={() => {
                            setOpenAppAssetsPanel(true);
                        }}
                    >
                        <KeyboardDoubleArrowRight />
                    </IconButton>
                )}
            </StyledCollapseTrigger>

            {/* If Open: displays App Explorer */}
            <StyledCollapse
                in={openAppAssetsPanel}
                timeout="auto"
                orientation={'horizontal'}
            >
                {/* Move into smaller component */}
                <StyledCollapseContainer>
                    <StyleAppExplorerHeader>
                        <Typography variant="h6">Explorer</Typography>
                    </StyleAppExplorerHeader>
                    {/* <AppExplorer
                        directory={appDirectory}
                        packages={[]}
                        onSelect={handleSelect}
                    /> */}
                    {/* Files Accordion */}
                    <div>
                        {/* <CustomAccordionTrigger
                            tabIndex={0}
                            role="button"
                            aria-expaned={true}
                            onClick={() => {
                                handleAccordionChange('file');
                            }}
                        >
                            <Icon>
                                <ExpandMore />
                            </Icon>
                            <Typography variant="body1">Files</Typography>
                        </CustomAccordionTrigger> */}

                        <Collapse in={openAccordion.indexOf('file') > -1}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflowX: 'scroll',
                                    paddingLeft: '-8px',
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
                        </Collapse>
                    </div>
                    {/* Dependencies Accordion*/}
                    {/* <div>
                        <CustomAccordionTrigger
                            tabIndex={0}
                            role="button"
                            aria-expaned={true}
                            onClick={() => {
                                handleAccordionChange('dependency');
                            }}
                        >
                            <Icon>
                                <ExpandMore />
                            </Icon>
                            <Typography variant="body1">
                                Dependencies
                            </Typography>
                        </CustomAccordionTrigger>
                        <Collapse in={openAccordion.indexOf('dependency') > -1}>
                            <span>Dependencies</span>
                        </Collapse>
                    </div> */}
                </StyledCollapseContainer>
            </StyledCollapse>

            {/* Text Editor */}
            <div
                style={{
                    // 100% - collapseCont - appEditorCont
                    width: openAppAssetsPanel
                        ? 'calc(100% - 42px - 250px)'
                        : 'calc(100% - 42px)',
                }}
            >
                <TextEditor
                    files={filesToView}
                    activeIndex={activeFileIndex}
                    setActiveIndex={(val: number) => {
                        setActiveFileIndex(val);
                    }}
                    onSave={(asset: ControlledFile) => {
                        console.log(
                            'App Editor onSave callback, hit Save Asset reactor and Refresh AppRenderer',
                            asset,
                        );
                        // Hit Save Asset Reactor for App
                        return saveApplicationAsset(asset);
                    }}
                />
            </div>
        </StyledEditorPanel>
    );
};
