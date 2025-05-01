import { usePixel, useRootStore } from '@/hooks';
import {
    Add,
    CloudDownload,
    Delete,
    SimCardDownload,
    UploadFile,
} from '@mui/icons-material';
import {
    Button,
    Checkbox,
    CircularProgress,
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
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

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

type FileUploadSingleForm = {
    PROJECT_UPLOAD_SINGLE: File;
};

interface FileExplorerProps {
    fileName: string;
    fileSize: number;
    lastModified: string;
}

export const FileTable = (props: FileTableProps) => {
    const NUM_RESULTS_PER_PAGE = 5;
    // embed modal
    const [open, setOpen] = useState<boolean>(false);

    //upload one file
    const [uploadFileModal, setUploadFileModal] = useState<boolean>(false);
    const [fileToUpload, setFileToUpload] = useState<FileExplorerProps | null>(
        null,
    );

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

    //download multiple files modal
    const [exportLoading, setExportLoading] = useState(false);

    //grabbing ID out of props
    const { id } = props;

    //for the pagination of the files page
    const paginationOptions = {
        filePageCounts: [NUM_RESULTS_PER_PAGE],
    };

    //adjusting for instance where there are more than 10 files
    fileCount > 9 && paginationOptions.filePageCounts.push(10);

    //For filtering files
    const { control, watch, setValue, handleSubmit } = useForm<{
        FILES: FileExplorerProps[];
        PROJECT_UPLOAD: File[];
        PROJECT_UPLOAD_SINGLE: File;
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Files Table
            FILES: [],
            // Filters for Files table
            SEARCH_FILTER: '',
            PROJECT_UPLOAD: [],
            PROJECT_UPLOAD_SINGLE: null,
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
            file.fileName.toLowerCase().includes(searchFilter.toLowerCase()),
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
            const response = await monolithStore.runQuery(`
                CreateEmbeddingsFromDocuments( engine= "${id}", filePaths= [${fileLocations}])
            `);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully added document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            //turn off loading
            getFileDetails.refresh();
            setIsLoading(false);
            setValue('PROJECT_UPLOAD', []);
            setValue('PROJECT_UPLOAD_SINGLE', null);
            setOpen(false);
        }
    });

    const deleteFile = async (file: FileExplorerProps) => {
        const { fileName } = file;
        setIsLoading(true);
        try {
            const response = await monolithStore.runQuery(`
            RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=["${fileName}"])
            `);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully removed document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'warning',
                message: `${e}`,
            });
        } finally {
            getFileDetails.refresh();
            setIsLoading(false);
            setDeleteFileModal(false);
        }
    };

    const deleteSelectedFiles = async (files: FileExplorerProps[]) => {
        // construct the string of files
        setIsLoading(true);
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
            const response = await monolithStore.runQuery(`
                RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=[${fileArray}])
            `);

            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully removed document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'warning',
                message: `${e}`,
            });
        } finally {
            //refresh files list, null the file to Delete, and close modal
            getFileDetails.refresh();
            setIsLoading(false);
            setFileToDelete(null);
            setDeleteFilesModal(false);
        }
    };

    const downloadSelectedFiles = async (files: FileExplorerProps[]) => {
        //Check for Source Exist or no
        let fileExistCounter = 0;
        files.forEach((f) => {
            checkFileExistForSource(f) ? ++fileExistCounter : '';
        });

        if (fileExistCounter == 0) {
            const output = 'File does not exist for the selected sources ';
            notification.add({
                color: 'error',
                message: output,
            });
            return;
        }
        // construct the string of files
        setExportLoading(true);
        let fileArray = '';
        files.forEach((file, index) => {
            const { fileName } = file;
            if (index + 1 === files.length) {
                //structuring the last element
                fileArray = fileArray + `"${fileName}"`;
            } else {
                // all but the last element
                fileArray = fileArray + `"${fileName}", `;
            }
        });

        const pixel = `META | VectorFileDownload(engine="${id}", fileNames=[${fileArray}]);`;

        monolithStore.runQuery(pixel).then((response) => {
            try {
                const { insightId } = response;
                const { output, operationType } = response.pixelReturn[0];
                if (operationType.indexOf('ERROR') === -1) {
                    monolithStore.download(insightId, output);
                    notification.add({
                        color: 'success',
                        message: `Successfully downloaded document`,
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                }
            } catch (e) {
                notification.add({
                    color: 'warning',
                    message: `${e}`,
                });
            }
        });
        setExportLoading(false);
    };

    //utility fn - if file size and last modiifed is not recevied meaning the file does not exist
    //i.e cant be downloaded and file needs to be attached to the source
    const checkFileExistForSource = (file: FileExplorerProps) => {
        if (
            file.lastModified &&
            file.lastModified !== '' &&
            file.fileSize &&
            file.fileSize > 0
        ) {
            return true;
        } else {
            return false;
        }
    };

    //donwload file from action
    const downloadSelectedFileAction = async (file: FileExplorerProps) => {
        setIsLoading(true);
        try {
            const pixel = `META | VectorFileDownload(engine="${id}", fileNames=["${file.fileName}"]);`;
            const response = await monolithStore.runQuery(pixel);
            const { insightId } = response;
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') === -1) {
                await monolithStore.download(insightId, output);
                notification.add({
                    color: 'success',
                    message: `Successfully downloaded document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'warning',
                message: `${e}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    //Upload file from action for csv
    const uploadSelectedFileAction = handleSubmit(
        async (file: FileUploadSingleForm) => {
            setIsLoading(true);
            try {
                const upload = await monolithStore.uploadFile(
                    [file.PROJECT_UPLOAD_SINGLE],
                    configStore.store.insightID,
                );
                const { fileLocation } = upload[0];
                const pixel = `VectorAttachFileToSource(engine="${id}", filePath=["\\${fileLocation}"], source="\\\\${fileToUpload.fileName}" );`;
                const response = await monolithStore.runQuery(pixel);
                const { output, operationType } = response.pixelReturn[0];
                if (operationType.indexOf('ERROR') === -1) {
                    notification.add({
                        color: 'success',
                        message: `Successfully Uploaded document`,
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                }
            } catch (e) {
                notification.add({
                    color: 'warning',
                    message: `${e}`,
                });
            } finally {
                setValue('PROJECT_UPLOAD_SINGLE', null);
                getFileDetails.refresh();
                setUploadFileModal(false);
                setIsLoading(false);
            }
        },
    );

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
                        {selectedFiles.length > 0 && (
                            <Button
                                disabled={exportLoading}
                                startIcon={
                                    exportLoading ? (
                                        <CircularProgress size="1em" />
                                    ) : (
                                        <SimCardDownload />
                                    )
                                }
                                variant="outlined"
                                onClick={() =>
                                    downloadSelectedFiles(selectedFiles)
                                }
                                style={{ marginRight: '10px' }}
                            >
                                Download
                            </Button>
                        )}
                        <Button
                            startIcon={<StyledIcon fontSize="small" />}
                            onClick={() => setOpen(true)}
                            variant="contained"
                        >
                            Embed New Document
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
                        <Table.Cell size="small">Date Uploaded</Table.Cell>
                        <Table.Cell size="small">Size</Table.Cell>
                        <Table.Cell size="small">Action</Table.Cell>
                    </Table.Head>
                    <Table.Body>
                        {verifiedFiles.map((x, i) => {
                            if (
                                i >=
                                    filePage * NUM_RESULTS_PER_PAGE -
                                        NUM_RESULTS_PER_PAGE &&
                                i < filePage * NUM_RESULTS_PER_PAGE
                            ) {
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
                                                {/* {Math.round(file.fileSize * 10,) / 10} {' '}KB */}
                                                {!isNaN(file.fileSize)
                                                    ? `${
                                                          Math.round(
                                                              file.fileSize *
                                                                  10,
                                                          ) / 10
                                                      } KB`
                                                    : ''}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {checkFileExistForSource(
                                                    file,
                                                ) ? (
                                                    <IconButton
                                                        onClick={() => {
                                                            downloadSelectedFileAction(
                                                                file,
                                                            );
                                                        }}
                                                    >
                                                        <CloudDownload />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        onClick={() => {
                                                            setFileToUpload(
                                                                file,
                                                            );
                                                            setUploadFileModal(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <UploadFile />
                                                    </IconButton>
                                                )}

                                                <IconButton
                                                    onClick={() => {
                                                        setDeleteFileModal(
                                                            true,
                                                        );
                                                        setFileToDelete(file);
                                                    }}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                }
                            }
                        })}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.Pagination
                                rowsPerPageOptions={[]}
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
                            startIcon={
                                isLoading ? (
                                    <CircularProgress size="1em" />
                                ) : (
                                    <></>
                                )
                            }
                        >
                            Embed
                        </Button>
                    </Modal.Actions>
                </form>
                {isLoading && <LinearProgress />}
            </Modal>
            {/* Single File upload */}
            <Modal
                open={uploadFileModal}
                onClose={() => {
                    setFileToUpload(null);
                    setUploadFileModal(false);
                    setValue('PROJECT_UPLOAD_SINGLE', null);
                }}
                fullWidth
            >
                <Modal.Title>
                    Attach File to Source {fileToUpload?.fileName}
                </Modal.Title>
                <form onSubmit={uploadSelectedFileAction}>
                    <Modal.Content>
                        <Controller
                            name={'PROJECT_UPLOAD_SINGLE'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <FileDropzone
                                        multiple={false}
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
                            onClick={() => {
                                setValue('PROJECT_UPLOAD_SINGLE', null);
                                setFileToUpload(null);
                                setUploadFileModal(false);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={isLoading}
                            startIcon={
                                isLoading ? (
                                    <CircularProgress size="1em" />
                                ) : (
                                    <></>
                                )
                            }
                        >
                            Upload
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
                        startIcon={
                            isLoading ? <CircularProgress size="1em" /> : <></>
                        }
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteFilesModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected sources
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
                        disabled={isLoading}
                        onClick={() => {
                            deleteSelectedFiles(selectedFiles);
                        }}
                        startIcon={
                            isLoading ? <CircularProgress size="1em" /> : <></>
                        }
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledFileContent>
    );
};
