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
    SyntheticEvent,
    ChangeEvent,
    HtmlHTMLAttributes,
} from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { TextEditor, ControlledFile } from '../';

import {
    Accordion,
    Button,
    Collapse,
    Divider,
    Modal,
    IconButton,
    TreeView,
    TextField,
    Icon,
    Skeleton,
    useNotification,
    styled,
    // makeStyles,
    Typography,
} from '@semoss/ui';

import {
    AutoAwesome,
    ContentCopyOutlined,
    Download,
    ExpandMore,
    ChevronRight,
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
    ExpandLess,
    CreateNewFolderOutlined,
    NoteAddOutlined,
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
    width: '50px',
    backgroundColor: theme.palette.secondary.light,
    padding: theme.spacing(1),
    // paddingLeft: theme.spacing(0.5),
    // zIndex: 9998,
}));

const StyledCollapse = styled(Collapse)(({ theme }) => ({
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledCollapseContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '250px',
    height: '100%',
    paddingTop: '0px',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    boxShadow: '5px 0 5px -2px rgba(0, 0, 0, 0.04)',
}));

const StyleAppExplorerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    // height: '5%',
    // paddingTop: '2px',
    alignItems: 'center',
}));

const CustomGenerateButton = styled(Button)(({ theme }) => {
    const palette = theme.palette as unknown as {
        purple: Record<string, string>;
    };

    return {
        backgroundColor: palette.purple['400'],
        color: theme.palette.background.paper,
        gap: theme.spacing(1),
        '&:hover': {
            backgroundColor: palette.purple['200'],
        },
    };
});

const CustomButton = styled(Button)(({ theme }) => {
    const palette = theme.palette as unknown as {
        purple: Record<string, string>;
    };

    return {
        backgroundColor: palette.purple['400'],
        color: theme.palette.background.paper,
        gap: theme.spacing(1),
        width: '100%',
        '&:hover': {
            backgroundColor: palette.purple['200'],
        },
    };
});

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
    alignItems: 'center',
    gap: theme.spacing(0.5),
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, .5)',
}));

const CustomAccordion = styled(Accordion)(({ theme }) => ({
    background: 'inherit',
    boxShadow: 'none',
    padding: '0',
    borderRadius: '0px',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:before': {
        display: 'none',
    },
    // '&:not(:last-child)': {
    //     borderBottom: 0,
    // },
}));

const CustomAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => ({
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: '0px',
    display: 'flex',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
    },
    '& .MuiAccordionDetails-root': {
        padding: '0px',
    },
}));

const CustomAccordionTriggerContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    // Icon Button Size
    height: `calc(1.125rem + 5px)`,
}));

const CustomAccordionContent = styled(Accordion.Content)(({ theme }) => ({
    maxHeight: '300px',
    display: 'flex',
    overflow: 'scroll',
    padding: '0px',
    // paddingTop: '8px',
    // paddingTop: '0px',
    // alignItems: 'center',
}));

const StyledExpandCode = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    background: theme.palette.secondary.main,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0px 0px`,
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.secondary.light,
    borderRadius: `0px 0px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
    padding: theme.spacing(2),
    margin: '0px',
    overflowX: 'scroll',
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
}));

interface AppEditorProps {
    /**
     * Id of App to get Directory
     */
    appId: string;
    /**
     * Width of AppEditor Panel, anytime this changes we may have to close AppExplorer
     */
    width: string;
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
    const { appId, width, onSave } = props;
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
    const newDirectoryRefs = useRef(null);

    // Props necessary for TextEditor component
    const [filesToView, setFilesToView] = useState([]);
    const [activeFileIndex, setActiveFileIndex] = useState(null);

    // Generate Code assistant
    const [generateCodeModal, setGenerateCodeModal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [loadCodeSnippet, setLoadCodeSnippet] = useState(false);

    useEffect(() => {
        getInitialAppStructure();
    }, []);

    useEffect(() => {
        if (newDirectoryRefs.current) {
            if (newDirectoryRefs.current.current) {
                newDirectoryRefs.current.current.scrollIntoView({
                    behavior: 'smooth', // You can choose 'auto' for immediate scrolling
                    block: 'center', // You can choose 'end' or 'center' as well
                    inline: 'nearest', // You can choose 'start' or 'end' as well
                });
            }
        }
    }, [newDirectoryRefs.current]);

    /**
     * Anytime Panel resizes we want to close/open explorer
     */
    useEffect(() => {
        const w = parseInt(width.replaceAll('%', ''));
        if (w < 35) {
            setOpenAppAssetsPanel(false);
        } else {
            setOpenAppAssetsPanel(true);
        }
    }, [width]);

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
     *
     * @desc This adds the placeholder node to your app directory
     */
    const addAssetToApp = async (
        node,
        newNodeName: string,
        assetType: 'directory' | 'file',
    ) => {
        let pixel = '';

        // We may not have to do below --
        const nodeReplacement = node;
        nodeReplacement.id = node.id.replace(/</g, '').replace(/>/g, '');
        nodeReplacement.id = nodeReplacement.id + newNodeName + '/';
        nodeReplacement.path = nodeReplacement.id;
        nodeReplacement.name = newNodeName;
        nodeReplacement.lastModified = Date.now();
        // --

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
            setSelected(parent ? [parent.id] : []);
            return;
        }

        // save nodeReplacement in tree
        if (assetType === 'directory') {
            await viewAsset([parent ? parent.id : ['version/assets']]);
            setSelected([nodeReplacement.id]);
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
            console.log(
                'TODO: Committing the Asset, view parent directory to refresh app structure after?',
            );
        }

        // set this file as the active file in the editor

        // setSelected([nodeReplacement.id]);
        setCounter(counter + 1);
    };

    /**
     * Method that is called to download the app
     */
    const downloadApp = async () => {
        try {
            const path = 'version/assets/';

            // upnzip the file in the new app
            const response = await monolithStore.runQuery(
                `DownloadAsset(filePath=["${path}"], space=["${appId}"]);`,
            );
            const key = response.pixelReturn[0].output;
            if (!key) {
                throw new Error('Error Downloading Asset');
            }

            await monolithStore.download(configStore.store.insightID, key);
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    /**
     * Assitant for adding code
     *
     */
    const generateCode = async () => {
        let pixel = '';

        // Project owner pays for these queries or should this come from Semoss.
        pixel += `LLM(engine=["${'EMB_5b0c6586-4ab8-4905-83e4-1bab3b6a1966'}"], command=["${generatePrompt}"])`;

        notification.add({
            color: 'warning',
            message: 'Please set LLM to use in RDF_MAP',
        });

        const response = await monolithStore.runQuery(pixel);
        const output = response.pixelReturn[0].output,
            operationType = response.pixelReturn[0].operationType;

        setLoadCodeSnippet(false);

        if (operationType.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });
            return;
        }

        // Regex anything between the 3 backticks
        const codeMatch = output.response.match(/```[\s\S]*?\n([\s\S]*)\n```/);

        // TO-DO: Figure out if there is a particular LLM that will have a consistent response structure
        if (!codeMatch) {
            notification.add({
                color: 'error',
                message: 'Unable to parse generated code',
            });
            return;
        }

        // Will this be multiple indexes
        if (codeMatch.length > 1) {
            setGeneratedCode(codeMatch[1]);
        }
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
    // Node Functions -------------
    // ----------------------------
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

    /**
     * @desc will remove the indexed file, in files to view,
     * Should trigger the useEffect in TextEditor
     */
    const removeFileToView = (index: number) => {
        const newFilesToView = filesToView;
        newFilesToView.splice(index, 1);

        if (activeFileIndex > index) {
            // Selected index is less than active
            setActiveFileIndex(activeFileIndex - 1);
        } else if (activeFileIndex > newFilesToView.length - 1) {
            // If Active File Index is out of bounds we have to subract 1
            setActiveFileIndex(newFilesToView.length - 1);
        }

        setFilesToView(newFilesToView);
        return true;
    };

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
            // 1. New nodes that need a name
            if (node.name === '' && node.id.includes('<>')) {
                if (!node.id) return <></>; // empty directory

                newDirectoryRefs.current = React.createRef();

                // 1a. While we are rendering tree nodes we need to set a ref for the placeholders
                return (
                    <TreeView.Item
                        sx={{
                            overflow: 'hidden',
                            '.MuiCollapse-wrapperInner': {
                                height: 'auto',
                                overflow: 'none',
                            },
                        }}
                        ref={newDirectoryRefs.current}
                        key={node.id}
                        nodeId={node.id}
                        title={'placeholder'}
                        label={
                            <TextField
                                size="small"
                                autoFocus={true}
                                onBlur={async (e) => {
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

                                        await viewAsset([
                                            !parent
                                                ? ['version/assets/']
                                                : parent.id,
                                        ]);
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
                                onKeyDown={async (e) => {
                                    e.stopPropagation();
                                    // listen for on enter on Input
                                    if (e.code === 'Enter') {
                                        const value =
                                            (
                                                e.target as unknown as {
                                                    value?: string;
                                                }
                                            )?.value || '';

                                        if (!value) {
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

                                            await viewAsset([
                                                !parent
                                                    ? ['version/assets/']
                                                    : parent.id,
                                            ]);
                                            setSelected(
                                                !parent
                                                    ? ['version/assets/']
                                                    : [parent.id],
                                            );
                                            return;
                                        }
                                        // 2. save the asset and change interface accordingly
                                        addAssetToApp(node, value, node.type);
                                    }
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
                        sx={{
                            overflow: 'hidden',
                            '.MuiCollapse-wrapperInner': {
                                height: 'auto',
                                overflow: 'none',
                            },
                        }}
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
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
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
                <div style={{ height: '5%' }}>
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
                </div>
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
                        <IconButton
                            size={'small'}
                            // color={'primary'}
                            // variant={'text'}
                            onClick={() => {
                                downloadApp();
                            }}
                        >
                            <Download />
                        </IconButton>
                    </StyleAppExplorerHeader>
                    <div
                        style={{
                            height: '95%',
                            overflow: 'hidden',
                            // border: 'solid yellow',
                        }}
                    >
                        <div
                            style={{
                                maxHeight: '85%',
                                // border: 'solid red',
                            }}
                        >
                            {process.env.NODE_ENV == 'development' && (
                                <CustomButton
                                    sx={{ marginTop: '16px' }}
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => {
                                        console.log(
                                            'Open Generate Code Modal and App Directory',
                                        );
                                        if (openAccordion.indexOf('file') < 0) {
                                            setOpenAccordion([
                                                ...openAccordion,
                                                'file',
                                            ]);
                                        }
                                        setGenerateCodeModal(true);
                                    }}
                                >
                                    <AutoAwesome />
                                    Generate Code
                                </CustomButton>
                            )}
                            <CustomAccordion
                                disableGutters
                                square={true}
                                expanded={
                                    openAccordion.indexOf('file') > -1
                                        ? true
                                        : false
                                }
                                onChange={() => {
                                    setExpanded([]);
                                    setSelected([]);
                                    handleAccordionChange('file');
                                }}
                            >
                                <CustomAccordionTrigger
                                    expandIcon={<ChevronRight />}
                                >
                                    <CustomAccordionTriggerContent>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow:
                                                    'ellipsis ellipsis',
                                            }}
                                        >
                                            <Typography variant="body1">
                                                App Directory
                                            </Typography>
                                        </div>
                                        {openAccordion.indexOf('file') > -1 ? (
                                            <StyledRow>
                                                <IconButton
                                                    size={'small'}
                                                    onClick={(e) => {
                                                        console.log(
                                                            'Add a directory to App',
                                                        );

                                                        e.stopPropagation();
                                                        addPlaceholderNode(
                                                            'directory',
                                                        );
                                                    }}
                                                >
                                                    <CreateNewFolderOutlined />
                                                </IconButton>
                                                <IconButton
                                                    size={'small'}
                                                    onClick={(e) => {
                                                        console.log(
                                                            'Add a file to App',
                                                        );
                                                        e.stopPropagation();
                                                        addPlaceholderNode(
                                                            'file',
                                                        );
                                                    }}
                                                >
                                                    <NoteAddOutlined />
                                                </IconButton>
                                            </StyledRow>
                                        ) : null}
                                    </CustomAccordionTriggerContent>
                                </CustomAccordionTrigger>
                                <CustomAccordionContent>
                                    {/* <StyledScrollableTreeView> */}
                                    <TreeView
                                        multiSelect
                                        sx={{
                                            width: '100%',
                                            maxHeight: '100%',
                                        }}
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
                                    </TreeView>
                                    {/* </StyledScrollableTreeView> */}
                                </CustomAccordionContent>
                            </CustomAccordion>
                        </div>

                        {/* Dependencies */}
                        <div
                            style={{
                                maxHeight: '85%',
                                // border: 'solid red',
                            }}
                        >
                            <CustomAccordion
                                disableGutters
                                square={true}
                                expanded={
                                    openAccordion.indexOf('dependency') > -1
                                        ? true
                                        : false
                                }
                                onChange={() => {
                                    setExpanded([]);
                                    setSelected([]);
                                    handleAccordionChange('dependency');
                                }}
                            >
                                <CustomAccordionTrigger
                                    expandIcon={<ChevronRight />}
                                >
                                    <Typography variant="body1">
                                        Dependencies
                                    </Typography>
                                </CustomAccordionTrigger>

                                <CustomAccordionContent>
                                    <Typography variant="body1">
                                        Currently in Progress ...
                                    </Typography>
                                </CustomAccordionContent>
                            </CustomAccordion>
                        </div>
                    </div>
                </StyledCollapseContainer>
            </StyledCollapse>

            {/* Text Editor */}
            <div
                style={{
                    // 100% - collapseCont - appEditorCont
                    width: openAppAssetsPanel
                        ? 'calc(100% - 50px - 250px)'
                        : 'calc(100% - 50px)',
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
                            // asset,
                        );
                        // Hit Save Asset Reactor for App
                        return saveApplicationAsset(asset);
                    }}
                    onClose={(index: number) => {
                        console.log('remove activeFileIndex from filesToView');
                        removeFileToView(index);
                    }}
                />
            </div>

            {/* Generate Code Modal */}
            <Modal open={generateCodeModal} maxWidth="xl">
                <Modal.Title
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                >
                    <Typography variant="h5">Code Generation</Typography>
                    <TextField
                        sx={{ width: '100%', marginTop: '8px' }}
                        label="Prompt"
                        helperText={
                            'Example prompt: "Write me a html form that intakes patient information"'
                        }
                        onKeyDown={(e) => {
                            if (e.code === 'Enter') {
                                // Remove Old Code
                                setGeneratedCode('');

                                // Load Skeleton for code
                                setLoadCodeSnippet(true);

                                // Generate code based on prompt
                                generateCode();
                            }
                        }}
                        onChange={(e) => {
                            setGeneratePrompt(e.target.value);
                        }}
                    ></TextField>
                </Modal.Title>
                <Modal.Content sx={{ width: '800px' }}>
                    {generatedCode ? (
                        <div>
                            <StyledExpandCode>
                                <IconButton>
                                    <ExpandMore />
                                </IconButton>
                                <Button
                                    size={'medium'}
                                    variant="outlined"
                                    startIcon={
                                        <ContentCopyOutlined
                                            color={'inherit'}
                                        />
                                    }
                                    onClick={() => copy(generatedCode)}
                                >
                                    Copy
                                </Button>
                            </StyledExpandCode>
                            <StyledCodeBlock>
                                <StyledCodeContent>
                                    {generatedCode}
                                </StyledCodeContent>
                            </StyledCodeBlock>
                        </div>
                    ) : loadCodeSnippet ? (
                        <div style={{ height: '200px' }}>
                            <Skeleton
                                variant={'rectangular'}
                                width={'100%'}
                                height={'100%'}
                            />
                        </div>
                    ) : null}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => {
                            setGenerateCodeModal(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <CustomGenerateButton
                        onClick={() => {
                            // Remove Old Code
                            setGeneratedCode('');

                            // Load Skeleton for code
                            setLoadCodeSnippet(true);

                            // Generate code based on prompt
                            generateCode();
                        }}
                    >
                        Generate
                    </CustomGenerateButton>
                </Modal.Actions>
            </Modal>
        </StyledEditorPanel>
    );
};
