import React, { useState, useRef } from 'react';
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
import { useFileManager } from '@/hooks';
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
}

export const FileTable = ({ id, mode, storagePath = '/' }: FileTableProps) => {
    const NUM_RESULTS_PER_PAGE = 5;

    const [open, setOpen] = useState<boolean>(false);
    const [deleteFileModal, setDeleteFileModal] = useState<boolean>(false);
    const [deleteFilesModal, setDeleteFilesModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

    const [filePage, setFilePage] = useState<number>(1);
    const fileSearchRef = useRef<HTMLInputElement>(null);

    const notification = useNotification();

    const [exportLoading, setExportLoading] = useState(false);
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('name');

    const {
        files,
        treeData,
        searchFilter,
        setSearchFilter,
        selectedFiles,
        setSelectedFiles,
        isLoading: fileManagerLoading
    } = useFileManager({
        engineId: id,
        mode,
        storagePath
    });

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
        PROJECT_UPLOAD: File[];
    }>({
        defaultValues: {
            PROJECT_UPLOAD: [],
        },
    });

    const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpandedFolders(nodeIds);
    };

    const renderTree = (nodes: any[]) => (
        <>
            {nodes.map((node: any) => (
                <TreeItem
                    key={node.path}
                    nodeId={node.path}
                    label={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {node.isLeaf ? (
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

    return (
        <StyledFileContent>
            {mode === 'storage' ? (
                <TreeView
                    aria-label="file system navigator"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpanded={expandedFolders}
                    onNodeToggle={handleNodeToggle}
                    multiSelect
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {renderTree(treeData)}
                </TreeView>
            ) : (
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>Files</Typography>
                        </StyledTableTitleDiv>
                        <Search
                            ref={fileSearchRef}
                            placeholder={'Search Files'}
                            size="small"
                            sx={{ marginRight: '20px' }}
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                        />
                    </StyledTableTitleContainer>
                    <StyledFileTable>
                        <Table.Head>
                            {headCell.map((cell) => (
                                <Table.Cell key={cell.id} size="small">
                                    {cell.label}
                                </Table.Cell>
                            ))}
                        </Table.Head>
                        <Table.Body>
                            {files.slice(
                                filePage * NUM_RESULTS_PER_PAGE - NUM_RESULTS_PER_PAGE,
                                filePage * NUM_RESULTS_PER_PAGE
                            ).map((file, i) => (
                                <Table.Row key={i}>
                                    <Table.Cell>{file.fileName}</Table.Cell>
                                    <Table.Cell>{file.lastModified}</Table.Cell>
                                    <Table.Cell>{Math.round(file.fileSize / 1024)} KB</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                        <Table.Footer>
                            <Table.Row>
                                <Table.Pagination
                                    rowsPerPageOptions={[]}
                                    onPageChange={(e, v) => setFilePage(v + 1)}
                                    page={filePage - 1}
                                    rowsPerPage={NUM_RESULTS_PER_PAGE}
                                    count={files.length}
                                />
                            </Table.Row>
                        </Table.Footer>
                    </StyledFileTable>
                </StyledTableContainer>
            )}
        </StyledFileContent>
    );
};