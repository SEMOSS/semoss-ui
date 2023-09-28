// --------------------
// Notes:
// This should get moved to Context.  Think through this more.
// - what callbacks are needed and what held in state

// Handles the View of or Text Editor alongside the App Explorer (Dir struct, Dependencies)
// This needs to handle Adding of Folders and Files to projects, and editting contents of existing
// --------------------
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
    Accordion,
    Button,
    Collapse,
    Divider,
    IconButton,
    TreeView,
    TextField,
    Icon,
    Skeleton,
    useNotification,
    styled,
    Typography,
} from '@semoss/ui';

import {
    CreateNewFolder,
    NoteAdd,
    ExpandMore,
    ChevronRight,
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
    ExpandLess,
} from '@mui/icons-material/';
import { Dependency } from 'webpack';

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
    backgroundColor: theme.palette.secondary.light,
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
    paddingRight: theme.spacing(2),
    boxShadow: '5px 0 5px -2px rgba(0, 0, 0, 0.04)',
    // border: 'solid green',
}));

const StyleAppExplorerHeader = styled('div')(({ theme }) => ({
    // border: 'solid green',
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    height: '5%',
    paddingTop: '2px',
    alignItems: 'center',
}));

const CustomAccordionTrigger = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // border: 'solid red',
    '&:hover': {
        cursor: 'pointer',
    },
    '&:focus': {
        cursor: 'pointer',
    },
}));

const StyledAppDirectoryLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
}));

const StyledScrollableTreeView = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    gap: '16px',
    overflowX: 'scroll',
    paddingLeft: '-8px',
}));

const StyledRow = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, .5)',
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

    const [openAccordion, setOpenAccordion] = useState([]);

    /**
     * FILE EXPLORER START OF CODE
     */
    const [appDirectory, setAppDirectory] = useState([]);
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    // Dummy state for refreshing with updated state
    const [counter, setCounter] = useState(0);

    // When we gather input from add new file/folder
    const newDirectoryRefs = useRef<HTMLInputElement[]>([]);

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
    const viewAsset = async (
        nodeIds: string[],
        event?: React.SyntheticEvent,
    ) => {
        if (nodeIds[0].indexOf('<>') > -1) {
            return;
        }

        // Gets the Selected Node in Tree View if present
        const foundNode = findNodeById(appDirectory, nodeIds[0]);

        let pixel = '',
            selectionType = 'directory';

        if (!foundNode) {
            pixel += `BrowseAsset(filePath=["version/assets"], space=["${appId}"]);`;
        } else if (foundNode.type === 'directory') {
            pixel += `BrowseAsset(filePath=["${foundNode.path}"], space=["${appId}"]);`;
            selectionType = 'directory';
        } else {
            pixel += `GetAsset(filePath=["${foundNode.path}"], space=["${appId}"]);`;
            selectionType = 'asset';
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

            if (folderContents.length) {
                folderContents.forEach((fc, i) => {
                    newNodeChildren.push({
                        ...fc,
                        id: fc.path,
                        children:
                            fc.type !== 'directory'
                                ? undefined
                                : [
                                      {
                                          id: `${fc.path}/${i}`,
                                          lastModified: '',
                                          name: '',
                                          path: '',
                                          type: '',
                                      },
                                  ],
                    });
                });
            } else {
                newNodeChildren.push({
                    id: '',
                    lastModified: '',
                    name: '',
                    path: '',
                    type: '',
                });
            }

            const formattedDirectoryNodes = sortArrayOfObjects(
                newNodeChildren,
                'type',
            );

            let updatedTreeData = [];

            if (foundNode) {
                updatedTreeData = updateNodeRecursively(
                    appDirectory,
                    foundNode.id,
                    {
                        ...foundNode,
                        children: formattedDirectoryNodes,
                    },
                );
            }

            setAppDirectory(
                foundNode ? updatedTreeData : formattedDirectoryNodes,
            );
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
            newOpenAccords.splice(openAccordion.indexOf(type), 1);
        } else {
            newOpenAccords.push(type);
        }
        setOpenAccordion(newOpenAccords);
        // Band aid fix: refresh ui state change is a step behind
        setCounter(counter + 1);
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
     * removes a node by its id
     */
    const removeNodeById = async (nodes, targetId) => {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === targetId) {
                // Remove the node from its parent's children array
                nodes.splice(i, 1);
                return true; // Node was found and removed
            }
            if (node.children && node.children.length > 0) {
                const nodeRemoved = await removeNodeById(
                    node.children,
                    targetId,
                );
                if (nodeRemoved) {
                    return true; // Node was found and removed from children
                }
            }
        }
        return false; // Node with the specified ID not found
    };

    /**
     * Tree View add Asset
     * finds parent and node
     */
    const findNodeAndParentById = (nodes, targetId, parent = null) => {
        for (const node of nodes) {
            if (node.id === targetId) {
                return { node, parent }; // Found the node with the specified ID and its parent
            }
            if (node.children && node.children.length > 0) {
                const result = findNodeAndParentById(
                    node.children,
                    targetId,
                    node,
                );
                if (result.node) {
                    return result; // Found the node within children, along with its parent
                }
            }
        }
        return { node: null, parent: null }; // Node with the specified ID not found in the subtree
    };

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
     * Different Types of TreeNodes
     * - Defined In Project Node
     * - New file/dir added input Node
     */
    const renderTreeNodes = (nodes) => {
        return nodes.map((node, i) => {
            if (node.name === '' && node.id.includes('<>')) {
                if (!node.id) return <></>; // empty directory

                // 1. New nodes that need a name
                return (
                    <TreeView.Item
                        sx={{ overflow: 'hidden' }}
                        key={node.id}
                        nodeId={node.id}
                        title={'placeholder'}
                        label={
                            <TextField
                                size="small"
                                onBlur={async (e) => {
                                    console.log('Directory of nodes:', nodes);
                                    console.log(
                                        'AppDirectory with Placeholder node?',
                                        appDirectory,
                                    );
                                    e.stopPropagation();
                                    // 1. if name is still an empty string remove placeholder node
                                    if (e.target.value === '') {
                                        console.warn(
                                            'onBlur without new file/folder name present',
                                        );
                                        notification.add({
                                            color: 'error',
                                            message: `Please provide a ${node.type} name`,
                                        });
                                        const { parent } =
                                            await findNodeAndParentById(
                                                appDirectory,
                                                node.id,
                                            );

                                        await viewAsset([parent.id]);
                                        setSelected([parent.id]);
                                        return;
                                    }
                                    // 2. save the asset and change interface accordingly
                                    addAssetToApp(
                                        node,
                                        e.target.value,
                                        node.type,
                                    );
                                }}
                                onClick={(e) => {
                                    console.log(
                                        'removed event bubbling on TreeItem',
                                    );
                                    e.stopPropagation();
                                }}
                            />
                        }
                    >
                        {node.children && node.children.length > 0
                            ? renderTreeNodes(node.children)
                            : null}
                    </TreeView.Item>
                );
            } else {
                // 2. Node that is defined in tree
                return (
                    <TreeView.Item
                        sx={{ overflow: 'hidden' }}
                        key={node.id}
                        nodeId={node.id}
                        title={node.id}
                        label={
                            // File svg pack? (Js, html, etc)
                            node.name
                        }
                    >
                        {node.children && node.children.length > 0
                            ? renderTreeNodes(node.children)
                            : null}
                    </TreeView.Item>
                );
            }
        });
    };

    /**
     * @desc
     * This really needs to just set a placeholder Node in our Tree view.
     * To help us gather input for new file/folder name or contents
     */
    const addPlaceholderNode = (type: 'directory' | 'file') => {
        const newNode = {
            id: '',
            lastModified: '',
            name: '',
            path: '',
            type: type,
            // id: `${foundNode.id}<>`,
        };

        // 1. See where we are in app directory, needed to know where to add file/dir
        if (!expanded.length) {
            console.log('Handle top level dir addition', appDirectory);

            const appDirCopy = appDirectory;
            newNode.id = 'version/assets/<>';

            if (type === 'directory') {
                newNode['children'] = [
                    {
                        id: `version/assets/<>/`,
                        lastModified: '',
                        name: 'placeholder',
                        path: `version/assets/<>/`,
                        type: '',
                    },
                ];
            }

            appDirCopy.push(newNode);

            const formattedDirectoryNodes = sortArrayOfObjects(
                appDirCopy,
                'type',
            );

            setAppDirectory(formattedDirectoryNodes);
            // Band Aid fix update UI with state change
            setCounter(counter + 1);
        } else {
            console.log('Handles nodes that have a parent');
            const indexOfSelectedDirectory = expanded.indexOf(selected[0]);

            if (indexOfSelectedDirectory < 0) {
                notification.add({
                    color: 'error',
                    message: "Can't find Node on FE",
                });
                console.error('Error finding node');
                return;
            }

            const foundNode = findNodeById(
                appDirectory,
                !expanded.length ? '' : expanded[indexOfSelectedDirectory],
            );

            // 2. Add new NodeInterface to the chidren of that directory
            const nodeChildrenCopy = foundNode.children;

            newNode.id = `${foundNode.id}<>`;

            if (type === 'directory') {
                newNode['children'] = [
                    {
                        id: `${foundNode.id}<>/`,
                        lastModified: '',
                        name: 'placeholder',
                        path: `${foundNode.id}<>/`,
                        type: '',
                    },
                ];
            }

            nodeChildrenCopy.push(newNode);

            const formattedDirectoryNodes = sortArrayOfObjects(
                nodeChildrenCopy,
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

            // 3. Update it in state
            setAppDirectory(updatedTreeData);
        }
    };

    const addAssetToApp = async (
        node,
        newNodeName: string,
        assetType: 'directory' | 'file',
    ) => {
        let pixel = '';

        const nodeReplacement = node;
        nodeReplacement.id = node.id.replace(/</g, '').replace(/>/g, '');
        nodeReplacement.id = nodeReplacement.id + newNodeName + '/';
        nodeReplacement.path = nodeReplacement.id;
        nodeReplacement.name = newNodeName;
        nodeReplacement.lastModified = Date.now();

        // debugger
        if (assetType === 'directory') {
            pixel += `
            MakeDirectory(filePath=["${nodeReplacement.id}"], space=["${appId}"]);
            `;
        } else {
            pixel += `
            SaveAsset(fileName=["${nodeReplacement.id}"], content=["<encode></encode>"], space=["${appId}"]);
            `;
        }

        const { parent } = await findNodeAndParentById(appDirectory, node.id);

        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });

            await viewAsset(!parent ? ['version/assets/'] : [parent.id]);
            setSelected([parent.id]);
            return;
        }

        // save nodeReplacement in tree
        if (assetType === 'directory') {
            // setExpanded([...expanded, nodeReplacement.id]);
            setSelected([nodeReplacement.id]);
            await viewAsset([parent.id]);
        } else {
            const commitAssetPixel = `
            CommitAsset(filePath=["${nodeReplacement.id}"], comment=["Added Asset from App Editor: path='${nodeReplacement.id}' "], space=["${appId}"])
            `;

            const commitAssetResponse = await monolithStore.runQuery(
                commitAssetPixel,
            );
            const commitAssetOutput = commitAssetResponse.pixelReturn[0].output,
                commitAssetOperationType =
                    commitAssetResponse.pixelReturn[0].operationType;

            // TODO: FE code for commit asset
            console.log('Committing the Asset, FE code has');
        }

        // set this file as the active file in the editor

        // setSelected([nodeReplacement.id]);
        setCounter(counter + 1);
    };

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

            {/* If Open: Displays App Explorer */}
            <StyledCollapse
                in={openAppAssetsPanel}
                timeout="auto"
                orientation={'horizontal'}
            >
                {/* <AppExplorer
                    directory={appDirectory}
                    packages={[]}
                    onSelect={handleSelect}
                /> */}

                {/* Move into smaller component */}
                <StyledCollapseContainer>
                    <StyleAppExplorerHeader>
                        <Typography variant="h6">Explorer</Typography>
                    </StyleAppExplorerHeader>
                    <div style={{ height: '95%', overflow: 'hidden' }}>
                        {/* Files Accordion */}
                        <div>
                            <CustomAccordionTrigger
                                tabIndex={0}
                                role="button"
                                aria-expanded={true}
                                onClick={() => {
                                    setExpanded([]);
                                    setSelected([]);
                                    handleAccordionChange('file');
                                }}
                            >
                                <StyledRow>
                                    <StyledIcon>
                                        {openAccordion.indexOf('file') > -1 ? (
                                            <ExpandMore />
                                        ) : (
                                            <ChevronRight />
                                        )}
                                    </StyledIcon>
                                    <Typography variant="body1">
                                        App Directory
                                    </Typography>
                                </StyledRow>
                                {openAccordion.indexOf('file') > -1 ? (
                                    <StyledRow sx={{ gap: '0px' }}>
                                        <IconButton
                                            size={'small'}
                                            onClick={(e) => {
                                                console.log(
                                                    'Add a directory to App',
                                                );

                                                e.stopPropagation();
                                                addPlaceholderNode('directory');
                                            }}
                                        >
                                            <CreateNewFolder />
                                        </IconButton>
                                        <IconButton
                                            size={'small'}
                                            onClick={(e) => {
                                                console.log(
                                                    'Add a file to App',
                                                );
                                                e.stopPropagation();
                                                addPlaceholderNode('file');
                                            }}
                                        >
                                            <NoteAdd />
                                        </IconButton>
                                    </StyledRow>
                                ) : null}
                            </CustomAccordionTrigger>

                            <Collapse in={openAccordion.indexOf('file') > -1}>
                                <StyledScrollableTreeView>
                                    <TreeView
                                        multiSelect
                                        sx={{ width: '100%' }}
                                        expanded={expanded}
                                        selected={selected}
                                        onNodeToggle={handleToggle}
                                        onNodeSelect={(e, v) => {
                                            viewAsset(v, e);
                                        }}
                                        defaultCollapseIcon={
                                            <StyledIcon>
                                                <ExpandMore />
                                            </StyledIcon>
                                        }
                                        defaultExpandIcon={
                                            <StyledIcon>
                                                <ChevronRight />
                                            </StyledIcon>
                                        }
                                    >
                                        {renderTreeNodes(appDirectory)}
                                        {/* {renderTreeNodes(appDirectory).then(() => {
                                                put last InputRef into focus
                                        })} */}
                                    </TreeView>
                                </StyledScrollableTreeView>
                            </Collapse>
                            <Divider />
                        </div>

                        {/* Dependencies */}
                        <div>
                            <CustomAccordionTrigger
                                tabIndex={0}
                                role="button"
                                aria-expanded={true}
                                sx={{ height: '32px' }}
                                onClick={() => {
                                    handleAccordionChange('dependency');
                                }}
                            >
                                <StyledRow>
                                    <StyledIcon>
                                        {openAccordion.indexOf('dependency') >
                                        -1 ? (
                                            <ExpandMore />
                                        ) : (
                                            <ChevronRight />
                                        )}
                                    </StyledIcon>
                                    <Typography variant="body1">
                                        Dependencies
                                    </Typography>
                                </StyledRow>
                            </CustomAccordionTrigger>
                            <Collapse
                                in={openAccordion.indexOf('dependency') > -1}
                            >
                                <div style={{ padding: '8px' }}>
                                    <Typography variant="body1">
                                        Currently in Progress ...
                                    </Typography>
                                </div>
                            </Collapse>
                            <Divider />
                        </div>
                    </div>
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
