import React, { useState, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Button,
    Checkbox,
    FileDropzone,
    IconButton,
    LinearProgress,
    Modal,
    Search,
    styled,
    Table,
    Typography,
    useNotification,
} from '@semoss/ui';
import { Add, Delete } from '@mui/icons-material';
import { usePixel, useRootStore } from '@/hooks';

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
    /**
     * Id of the vector engine
     */
    id: string;
}

type FileUploadForm = {
    PROJECT_UPLOAD: File[];
};

interface FileExplorerProps {
    fileName: string;
    fileSize: number;
    lastModified: string;
}

export const FileTable = (props: FileTableProps) => {
    // embed modal
    const [open, setOpen] = useState<boolean>(false);

    //delete one file
    const [deleteFileModal, setDeleteFileModal] = useState<boolean>(false);
    const [fileToDelete, setFileToDelete] = useState<FileExplorerProps | null>(
        null,
    );
    //deleting multiple files modal
    const [deleteFilesModal, setDeleteFilesModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<FileExplorerProps[]>([]);
    const [filePage, setFilePage] = useState<number>(1);
    const [fileCount, setFileCount] = useState<number>(0);
    const [filteredFileCount, setFilteredFileCount] = useState<number>(0);
    const fileSearchRef = useRef(undefined);
    const didMount = useRef<boolean>(false);
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    //grabbing ID out of props
    const { id } = props;

    //for the pagination of the files page
    const paginationOptions = {
        filePageCounts: [5],
    };

    //adjusting for instance where there are more than 10 files
    fileCount > 9 && paginationOptions.filePageCounts.push(10);

    //For filtering files
    const { control, watch, setValue, handleSubmit } = useForm<{
        FILES: FileExplorerProps[];
        PROJECT_UPLOAD: File[];
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Files Table
            FILES: [],
            // Filters for Files table
            SEARCH_FILTER: '',
            PROJECT_UPLOAD: [],
        },
    });

    const searchFilter = watch('SEARCH_FILTER');
    const verifiedFiles = watch('FILES');

    //Grabbing list of files in a Vector Database
    const getFileDetails = usePixel<FileExplorerProps[]>(`
        ListDocumentsInVectorDatabase(engine="${id}")
    `);
    //updating the file details list
    /**
     * @name useEffect
     * @desc - sets files in react hook form
     */
    useEffect(() => {
        if (getFileDetails.status !== 'SUCCESS' || !getFileDetails.data) {
            return;
        }

        const files = [];
        // push files into file array
        getFileDetails.data.forEach((file) => {
            files.push(file);
        });

        //filter using search term
        const filteredFiles = files.filter((file) =>
            file.fileName.includes(searchFilter),
        );
        setValue('FILES', filteredFiles);

        if (!didMount.current) {
            // set total members
            setFileCount(getFileDetails.data.length);
            didMount.current = true;
        }
        // Needed for total pages on pagination
        setFilteredFileCount(filteredFiles.length);

        fileSearchRef.current?.focus();
        return () => {
            console.log('Cleaning files table');
            setValue('FILES', []);
            setSelectedFiles([]);
        };
    }, [getFileDetails.status, getFileDetails.data, searchFilter]);

    //Method that is called for embedding a file
    const embedFile = handleSubmit(async (data: FileUploadForm) => {
        setIsLoading(true);

        //string that will become the filePaths
        let fileLocations = '';

        try {
            //upload the file
            const upload = await monolithStore.uploadFile(
                data.PROJECT_UPLOAD,
                configStore.store.insightID,
            );

            upload.map((file, index) => {
                const { fileLocation } = file;
                if (index + 1 === upload.length) {
                    //last member
                    fileLocations = fileLocations += `"${fileLocation}"`;
                } else {
                    //all other members
                    fileLocations = fileLocations += `"${fileLocation}", `;
                }
            });

            // Embedding the File
            await monolithStore.runQuery(`
                CreateEmbeddingsFromDocuments( engine= "${id}", filePaths= [${fileLocations}])
            `);
        } catch (e) {
            console.error(e);
        } finally {
            //turn off loading
            setIsLoading(false);
            setOpen(false);
        }
    });

    const deleteFile = async (file: FileExplorerProps) => {
        const { fileName } = file;
        try {
            await monolithStore.runQuery(`
            RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=["${fileName}"])
            `);
        } catch (e) {
            notification.add({
                color: 'warning',
                message: `${e}`,
            });
        } finally {
            getFileDetails.refresh();
            setDeleteFileModal(false);
        }
    };

    const deleteSelectedFiles = async (files: FileExplorerProps[]) => {
        // construct the string of files
        let fileArray = '';
        files.map((file, index) => {
            const { fileName } = file;
            if (index + 1 === files.length) {
                //structuring the last element
                fileArray = fileArray + `"${fileName}"`;
            } else {
                // all but the last element
                fileArray = fileArray + `"${fileName}", `;
            }
        });

        try {
            await monolithStore.runQuery(`
                RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=[${fileArray}])
            `);
        } catch (e) {
            notification.add({
                color: 'warning',
                message: `${e}`,
            });
        } finally {
            //refresh files list, null the file to Delete, and close modal
            getFileDetails.refresh();
            setFileToDelete(null);
            setDeleteFilesModal(false);
        }
    };

    return (
        <StyledFileContent>
            <StyledTableContainer>
                <StyledTableTitleContainer>
                    <StyledTableTitleDiv>
                        <Typography variant={'h6'}>Files</Typography>
                    </StyledTableTitleDiv>

                    <div>
                        <Search
                            ref={fileSearchRef}
                            placeholder={'Search Files'}
                            size="small"
                            sx={{ marginRight: '20px' }}
                            value={searchFilter}
                            onChange={(e) => {
                                setValue('SEARCH_FILTER', e.target.value);
                            }}
                        />
                        {selectedFiles.length > 0 && (
                            <Button
                                variant={'outlined'}
                                color="error"
                                sx={{ marginRight: '10px' }}
                                onClick={() => setDeleteFilesModal(true)}
                            >
                                Delete Selected
                            </Button>
                        )}
                        <Button
                            onClick={() => setOpen(true)}
                            variant="contained"
                        >
                            <StyledIcon fontSize="small" /> Embed New Document
                        </Button>
                    </div>
                </StyledTableTitleContainer>

                <StyledFileTable>
                    <Table.Head>
                        <Table.Cell size="small">
                            <Checkbox
                                checked={
                                    selectedFiles.length ===
                                        verifiedFiles.length &&
                                    verifiedFiles.length > 0
                                }
                                onChange={() => {
                                    if (
                                        selectedFiles.length !==
                                        verifiedFiles.length
                                    ) {
                                        setSelectedFiles(verifiedFiles);
                                    } else {
                                        setSelectedFiles([]);
                                    }
                                }}
                            />
                        </Table.Cell>
                        <Table.Cell size="small">Name</Table.Cell>
                        <Table.Cell size="small">Date Modified</Table.Cell>
                        <Table.Cell size="small">Size</Table.Cell>
                        <Table.Cell size="small">Action</Table.Cell>
                    </Table.Head>
                    <Table.Body>
                        {verifiedFiles.map((x, i) => {
                            const file = verifiedFiles[i];

                            let isSelected = false;

                            if (file) {
                                isSelected = selectedFiles.some((value) => {
                                    return value.fileName === file.fileName;
                                });
                            }
                            if (file) {
                                return (
                                    <Table.Row key={i}>
                                        <Table.Cell size="medium">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (isSelected) {
                                                        const selFiles = [];
                                                        selectedFiles.forEach(
                                                            (u) => {
                                                                if (
                                                                    u.fileName !==
                                                                    file.fileName
                                                                ) {
                                                                    selFiles.push(
                                                                        u,
                                                                    );
                                                                }
                                                            },
                                                        );
                                                        setSelectedFiles(
                                                            selFiles,
                                                        );
                                                    } else {
                                                        setSelectedFiles([
                                                            ...selectedFiles,
                                                            file,
                                                        ]);
                                                    }
                                                }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell
                                            size="medium"
                                            component="td"
                                            scope="row"
                                        >
                                            {file.fileName}
                                        </Table.Cell>
                                        <Table.Cell
                                            size="medium"
                                            component="td"
                                            scope="row"
                                        >
                                            {file.lastModified}
                                        </Table.Cell>
                                        <Table.Cell
                                            size="medium"
                                            component="td"
                                            scope="row"
                                        >
                                            {Math.round(file.fileSize * 10) /
                                                10}{' '}
                                            KB
                                        </Table.Cell>
                                        <Table.Cell>
                                            <IconButton
                                                onClick={() => {
                                                    setDeleteFileModal(true);
                                                    setFileToDelete(file);
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            }
                        })}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.Pagination
                                rowsPerPageOptions={
                                    paginationOptions.filePageCounts
                                }
                                onPageChange={(e, v) => {
                                    setFilePage(v + 1);
                                    setSelectedFiles([]);
                                }}
                                page={filePage - 1}
                                rowsPerPage={5}
                                count={filteredFileCount}
                            />
                        </Table.Row>
                    </Table.Footer>
                </StyledFileTable>
            </StyledTableContainer>
            <Modal open={open} onClose={() => setOpen(false)} fullWidth>
                <Modal.Title>Upload Files</Modal.Title>
                <form onSubmit={embedFile}>
                    <Modal.Content>
                        <Controller
                            name={'PROJECT_UPLOAD'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <FileDropzone
                                        multiple={true}
                                        value={field.value}
                                        extensions={[
                                            '.pdf',
                                            '.csv',
                                            '.txt',
                                            '.doc',
                                            '.ppt',
                                            '.docx',
                                            '.pptx',
                                        ]}
                                        disabled={isLoading}
                                        onChange={(newValues) => {
                                            field.onChange(newValues);
                                        }}
                                    />
                                );
                            }}
                        />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant={'outlined'}
                            disabled={isLoading}
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={isLoading}
                        >
                            Embed
                        </Button>
                    </Modal.Actions>
                </form>
                {isLoading && <LinearProgress />}
            </Modal>
            <Modal open={deleteFileModal} maxWidth="md">
                <Modal.Title>
                    <Typography variant="h6">Are you sure?</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>
                        {fileToDelete && (
                            <Typography variant="body1">
                                This will remove <b>{fileToDelete.fileName}</b>
                            </Typography>
                        )}
                    </Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteFileModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="error"
                        variant={'contained'}
                        onClick={() => {
                            if (!fileToDelete) {
                                console.error('No user to delete');
                            }
                            deleteFile(fileToDelete);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteFilesModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected members
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteFilesModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        color="error"
                        onClick={() => {
                            deleteSelectedFiles(selectedFiles);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledFileContent>
    );
};
