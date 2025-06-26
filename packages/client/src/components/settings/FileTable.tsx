import React, { useState, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Button,
    Checkbox,
    FileDropzone,
    IconButton,
    LinearProgress,
    CircularProgress,
    Modal,
    Search,
    styled,
    Table,
    Typography,
    useNotification,
    TreeView,
} from '@semoss/ui';
import { Add, Delete, SimCardDownload } from '@mui/icons-material';
import { usePixel, useRootStore } from '@/hooks';
import { TreeItem } from '@semoss/ui/src/components/TreeView/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTableTitleContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
    backgroundColor: 'white',
    justifyContent: 'space-between',
});

const StyledFileContent = styled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '25px',
    flexShrink: '0',
    paddingLeft: '5px',
});

const StyledTableTitleDiv = styled('div')({
    display: 'flex',
    padding: '12px 24px 12px 16px',
    alignItems: 'center',
    gap: '10px',
});

const StyledIcon = styled(Add)(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

const StyledFileTable = styled(Table)({ backgroundColor: 'white' });

interface FileTableProps {
    id: string;
    mode: 'vector' | 'storage';
    storagePath?: string;
}

type FileUploadForm = {
    PROJECT_UPLOAD: File[];
};

interface FileExplorerProps {
    fileName: string;
    fileSize: number;
    lastModified: string;
    key?: string; // only used in storage mode
}

// For directory tree
interface TreeNode {
    name: string;
    path: string;
    isLeaf: boolean;
    children: TreeNode[];
    fileSize?: number;
    lastModified?: string;
}

export const FileTable = ({ id, mode, storagePath = '/' }: FileTableProps) => {
    const NUM_RESULTS_PER_PAGE = 5;

    // Modal states
    const [open, setOpen] = useState<boolean>(false);
    const [deleteFileModal, setDeleteFileModal] = useState<boolean>(false);
    const [fileToDelete, setFileToDelete] = useState<FileExplorerProps | null>(null);
    const [deleteFilesModal, setDeleteFilesModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<FileExplorerProps[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);

    const [filePage, setFilePage] = useState<number>(1);
    const [fileCount, setFileCount] = useState<number>(0);
    const [filteredFileCount, setFilteredFileCount] = useState<number>(0);
    const fileSearchRef = useRef<HTMLInputElement>(null);
    const didMount = useRef<boolean>(false);

    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const [exportLoading, setExportLoading] = useState(false);
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('name');

    const headCell = [
        {
            id: 'name',
            numeric: false,
            disablePadding: true,
            label: 'Name',
        },
        {
            id: 'date',
            numeric: true,
            disablePadding: false,
            label: 'Date Uploaded',
        },
        {
            id: 'size',
            numeric: true,
            disablePadding: false,
            label: 'Size',
        },
    ];

    const { control, watch, setValue, handleSubmit } = useForm<{
        FILES: FileExplorerProps[];
        PROJECT_UPLOAD: File[];
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            FILES: [],
            SEARCH_FILTER: '',
            PROJECT_UPLOAD: [],
        },
    });

    const searchFilter = watch('SEARCH_FILTER');
    const verifiedFiles = watch('FILES');

    const query =
        mode === 'vector'
            ? `ListDocumentsInVectorDatabase(engine="${id}")`
            : `Storage(storage = '${id}') | ListStoragePathDetails(storagePath="/")`;

    const getFileDetails = usePixel<FileExplorerProps[]>(query);

    // Build folder tree from storage keys
    useEffect(() => {
        if (mode !== 'storage' || !getFileDetails.data || getFileDetails.status !== 'SUCCESS') return;

        const root: TreeNode = { name: '', path: '', isLeaf: false, children: [] };

        getFileDetails.data.forEach((item: any) => {
            const fullPath = item.key;
            const parts = fullPath.split('/').filter(Boolean);
            let current = root;

            parts.forEach((part, i) => {
                const isLeaf = i === parts.length - 1 && !fullPath.endsWith('/');
                const existing = current.children.find((c) => c.name === part);

                if (existing) {
                    current = existing;
                } else {
                    const newPath = `${current.path}${current.path ? '/' : ''}${part}`;
                    const node: TreeNode = {
                        name: part,
                        path: newPath,
                        isLeaf,
                        children: [],
                        ...(isLeaf && {
                            fileSize: item.size,
                            lastModified: new Date(item.lastModified.seconds * 1000).toLocaleString(),
                        }),
                    };
                    current.children.push(node);
                    current = node;
                }
            });
        });

        setTreeData(root.children);
    }, [getFileDetails.status, getFileDetails.data]);

    // Handle flat file listing for vector mode or search
    useEffect(() => {
        console.log('Fetching files for', id);
        if (getFileDetails.status !== 'SUCCESS' || !getFileDetails.data) return;

        let files: FileExplorerProps[] = [];

        if (mode === 'storage') {
            files = getFileDetails.data.map((item: any) => ({
                fileName: item.key,
                fileSize: item.size,
                lastModified: new Date(item.lastModified.seconds * 1000).toLocaleString(),
            }));
        } else {
            files = [...getFileDetails.data];
        }

        const filteredFiles = files.filter(
            (file) =>
                !searchFilter ||
                file.fileName?.toLowerCase().includes(searchFilter.toLowerCase())
        );

        filteredFiles.sort(
            (a, b) =>
                new Date(a.lastModified).getTime() -
                new Date(b.lastModified).getTime()
        );

        setValue('FILES', filteredFiles);
        if (!didMount.current) {
            setFileCount(getFileDetails.data.length);
            didMount.current = true;
        }
        setFilteredFileCount(filteredFiles.length);
        fileSearchRef.current?.focus();

        return () => {
            setValue('FILES', []);
            setSelectedFiles([]);
        };
    }, [getFileDetails.status, getFileDetails.data, searchFilter]);

    const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpandedFolders(nodeIds);
    };

    const renderTree = (nodes: TreeNode[]) => (
        <>
            {nodes.map((node) => (
                <TreeItem
                    key={node.path}
                    nodeId={node.path}
                    label={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {node.isLeaf? (
                                <InsertDriveFileIcon fontSize="small" />
                            ) : (
                                <FolderOpenIcon fontSize="small" />
                            )}
                            <span style={{ marginLeft: 8 }}>
                                {node.name}
                                {!node.isLeaf && ` (${node.children.length})`}
                            </span>
                        </div>
                    }
                >
                    {node.children.length > 0 && renderTree(node.children)}
                </TreeItem>
            ))}
        </>
    );

    // Existing functions like deleteFile, embedFile, downloadSelectedFiles remain unchanged...
    // ...add them here from original code...

    return (
        <StyledFileContent>
            {mode === 'storage' ? (
                <TreeView
                    aria-label="file system navigator"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandAll={false}
                    defaultExpanded={expandedFolders}
                    onNodeToggle={handleNodeToggle}
                    multiSelect
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {renderTree(treeData)}
                </TreeView>
            ) : (
                <StyledTableContainer>
                    {/* Flat table view for vector mode */}
                    <StyledTableTitleContainer>...</StyledTableTitleContainer>
                    <StyledFileTable>...</StyledFileTable>
                </StyledTableContainer>
            )}

            {/* Modals and other components go here */}
        </StyledFileContent>
    );
};