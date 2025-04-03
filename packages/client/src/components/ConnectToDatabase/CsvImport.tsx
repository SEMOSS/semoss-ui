import { useRootStore, useStepper } from '@/hooks';
import {
    Button,
    CircularProgress,
    FileDropzone,
    MenuItem,
    Select,
    styled,
    TextArea,
    TextField,
    useNotification,
} from '@semoss/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataSelection from './DataSelection';
import { useForm } from 'react-hook-form';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

type Props = {};

function CsvImport({}: Props) {
    const StyledTextField = styled('div')(() => ({
        cursor: 'not-allowed',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        height: '40px',
        border: '1px solid #e0e0e0',
        borderRadius: '7px',
        color: '#9E9E9E',
        padding: '8px',
    }));
    const StyledDiv = styled('div')(() => ({
        display: 'flex',
        width: '100%',
        gap: '25px',
    }));

    const [step, setStep] = useState<'import' | 'selection'>('import');
    const databaseTypeOptions = [
        { label: 'H2', value: 'h2' },
        { label: 'RDF', value: 'rdf' },
        { label: 'Tinker', value: 'tinker' },
        { label: 'R', value: 'r' },
    ];
    const metaModelTypeOptions = [
        { label: 'As Flat Table', value: 'asFlatTable' },
        { label: 'As Suggested Metamodel', value: 'asSuggestedMetamodel' },
        { label: 'From Scratch', value: 'fromScratch' },
        { label: 'From Prop File', value: 'frompropFile' },
    ];
    const [formLoading, setFormLoading] = useState(false);
    const { watch } = useForm();
    const [dbName, setDbName] = useState('');
    const [dbDescription, setDbDescription] = useState('');
    const [dbTag, setDbTag] = useState('');
    const [delimiter, setDelimiter] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File[]>([]);
    const [selectedDbType, setSelectedDbType] = useState<string>();
    const [selectedMetaModelType, setSelectedMetaModelType] =
        useState<string>();
    const { monolithStore, configStore } = useRootStore();
    const [parsedData, setParsedData] = useState<any>(null);
    const [filePath, setfilePath] = useState<string>();
    const notification = useNotification();
    const { steps } = useStepper();
    const navigate = useNavigate();
    const IsDisabled = uploadedFile.length === 0;
    const onFileUpload = (files: File | File[]) => {
        const fileArray = Array.isArray(files) ? files : [files];
        setUploadedFile((prevFiles) => [...prevFiles, ...fileArray]);
        setSelectedDbType(databaseTypeOptions[0].value);
        setSelectedMetaModelType(metaModelTypeOptions[0].value);
    };
    const dbNameRef = useRef<HTMLInputElement | null>(null);
    const dbDescRef = useRef<HTMLInputElement | null>(null);
    const dbTagRef = useRef<HTMLInputElement | null>(null);
    const delimiterRef = useRef<HTMLInputElement | null>(null);

    const formatFileSize = (size: number) => {
        if (size < 1024) {
            return `${size} B`;
        } else if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(2)} KB`;
        } else if (size < 1024 * 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    };

    useEffect(() => {
        dbNameRef.current?.focus();
    }, [dbName]);
    useEffect(() => {
        dbDescRef.current?.focus();
    }, [dbDescription]);
    useEffect(() => {
        dbTagRef.current?.focus();
    }, [dbTag]);
    useEffect(() => {
        delimiterRef.current?.focus();
    }, [delimiter]);

    const onSubmit = async () => {
        if (!dbName) {
            notification.add({
                color: 'error',
                message: 'Please Enter Database Name',
            });
            return;
        } else if (!dbDescription) {
            notification.add({
                color: 'error',
                message: 'Please Enter Database Description',
            });
            return;
        } else if (!dbTag) {
            notification.add({
                color: 'error',
                message: 'Please Enter Database Tag',
            });
            return;
        }
        setFormLoading(true);
        try {
            const upload = await monolithStore.uploadFile(
                uploadedFile,
                configStore.store.insightID,
            );
            const pixelString =
                steps[0].data === 'DATABASE'
                    ? `PredictDataTypes(filePath=["${upload[0].fileLocation}"])`
                    : `UploadEngine(filePath=["${upload[0].fileLocation}"], engineTypes=["${steps[0].data}"])`;

            const response = await monolithStore.runQuery(pixelString);
            const output = response.pixelReturn[0].output;
            console.log('parsedData', output);
            const operationType = response.pixelReturn[0].operationType;
            const pixelExpression = response.pixelReturn[0].pixelExpression;
            const filePathMatch = pixelExpression.match(
                /filePath\s*=\s*\[\s*"(.+?)"\s*\]/,
            );
            const filePathFromExpression = filePathMatch
                ? filePathMatch[1]
                : null;
            setfilePath(filePathFromExpression);

            if (operationType.includes('ERROR')) {
                notification.add({ color: 'error', message: output });
                setFormLoading(false);
                return;
            }
            setParsedData(output);
            setStep('selection');
        } catch (error) {
            console.error('Upload error:', error);
            notification.add({
                color: 'error',
                message: 'An error occurred while uploading.',
            });
        } finally {
            setFormLoading(false);
        }
    };

    console.log('filePath', filePath);
    const handleCancel = () => {
        setStep('import');
        setUploadedFile(uploadedFile);
    };

    const watchDatabaseName = dbName;
    const watchFile = filePath;
    const newHeaders = {};
    const descriptionMap = {};
    const logicalNamesMap = {};

    const submitMetmodelPixel = async (payloadObject) => {
        let pixel = `RdbmsUploadTableData(
            database=["${watchDatabaseName}"],
            filePath=["${watchFile}"],
            delimiter=["${delimiter}"],
            dataTypeMap=[${JSON.stringify(payloadObject.dataTypes)}],
            newHeaders=[${JSON.stringify(newHeaders)}],
            additionalDataTypes=[${JSON.stringify(
                payloadObject.additionalDataTypes,
            )}],
            descriptionMap=[${JSON.stringify(descriptionMap)}],
            logicalNamesMap=[${JSON.stringify(logicalNamesMap)}],
            existing=[false]
        );`;

        try {
            const response = await monolithStore.runQuery(pixel);
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.includes('ERROR')) {
                notification.add({
                    color: 'error',
                    message: output,
                });
                return;
            }

            notification.add({
                color: 'success',
                message: 'Success',
            });

            navigate(`/engine/database/${output.database_id}`);
        } catch (error) {
            notification.add({
                color: 'error',
                message: 'An error occurred while processing the request.',
            });
            console.error('Error executing query:', error);
        }
    };

    return (
        <>
            {step === 'import' ? (
                <form>
                    <StyledDiv>
                        <StyledDiv>
                            <div
                                style={{
                                    width: '660px',
                                    height: '375px',
                                }}
                            >
                                <FileDropzone
                                    multiple={true}
                                    onChange={onFileUpload}
                                />
                                {uploadedFile.length > 0 && (
                                    <>
                                        <div
                                            style={{
                                                marginTop: '10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px',
                                            }}
                                        >
                                            {uploadedFile.map((file, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '10px',
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: '7px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection:
                                                                'column',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    padding:
                                                                        '2px',
                                                                    marginRight:
                                                                        '10px',
                                                                }}
                                                            >
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 18 18"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <g id="Group">
                                                                        <g id="Group_2">
                                                                            <path
                                                                                id="Vector"
                                                                                d="M12.2908 1.29083C11.9425 0.9425 11.475 0.75 10.9892 0.75H2.58333C1.575 0.75 0.759167 1.575 0.759167 2.58333L0.75 15.4167C0.75 16.425 1.56583 17.25 2.57417 17.25H15.4167C16.425 17.25 17.25 16.425 17.25 15.4167V7.01083C17.25 6.525 17.0575 6.0575 16.7092 5.71833L12.2908 1.29083ZM5.33333 13.5833C4.82917 13.5833 4.41667 13.1708 4.41667 12.6667C4.41667 12.1625 4.82917 11.75 5.33333 11.75C5.8375 11.75 6.25 12.1625 6.25 12.6667C6.25 13.1708 5.8375 13.5833 5.33333 13.5833ZM5.33333 9.91667C4.82917 9.91667 4.41667 9.50417 4.41667 9C4.41667 8.49583 4.82917 8.08333 5.33333 8.08333C5.8375 8.08333 6.25 8.49583 6.25 9C6.25 9.50417 5.8375 9.91667 5.33333 9.91667ZM5.33333 6.25C4.82917 6.25 4.41667 5.8375 4.41667 5.33333C4.41667 4.82917 4.82917 4.41667 5.33333 4.41667C5.8375 4.41667 6.25 4.82917 6.25 5.33333C6.25 5.8375 5.8375 6.25 5.33333 6.25ZM10.8333 6.25V2.125L15.875 7.16667H11.75C11.2458 7.16667 10.8333 6.75417 10.8333 6.25Z"
                                                                                fill="black"
                                                                                fill-opacity="0.54"
                                                                            />
                                                                        </g>
                                                                    </g>
                                                                </svg>
                                                            </div>
                                                            <div></div>
                                                            {file.name}
                                                        </span>
                                                        <div
                                                            style={{
                                                                marginLeft:
                                                                    '35px',
                                                                fontSize:
                                                                    '15px',
                                                            }}
                                                        >
                                                            {formatFileSize(
                                                                file.size,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="text"
                                                        color="inherit"
                                                        onClick={() =>
                                                            setUploadedFile(
                                                                (prev) =>
                                                                    prev.filter(
                                                                        (
                                                                            _,
                                                                            i,
                                                                        ) =>
                                                                            i !==
                                                                            index,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        <DeleteOutlineOutlinedIcon
                                                            sx={{
                                                                color: '#212121',
                                                                opacity: '54%',
                                                            }}
                                                        ></DeleteOutlineOutlinedIcon>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </StyledDiv>
                        <StyledDiv>
                            <div style={{ width: '100%', marginTop: '5px' }}>
                                <div
                                    style={{
                                        marginBottom: '20px',
                                        color: ' #212121',
                                        fontWeight: '600',
                                    }}
                                >
                                    General
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <TextField
                                        inputRef={dbNameRef}
                                        sx={{ borderRadius: '7px' }}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter Database Name *"
                                        value={dbName}
                                        onChange={(e) =>
                                            setDbName(e.target.value)
                                        }
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <TextArea
                                        inputRef={dbDescRef}
                                        sx={{ borderRadius: '7px' }}
                                        fullWidth
                                        placeholder="Enter Database Description *"
                                        minRows={4}
                                        maxRows={12}
                                        value={dbDescription}
                                        onChange={(e) =>
                                            setDbDescription(e.target.value)
                                        }
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <TextField
                                        inputRef={dbTagRef}
                                        sx={{ borderRadius: '7px' }}
                                        size="small"
                                        fullWidth
                                        placeholder=" Enter Database Tags *"
                                        value={dbTag}
                                        onChange={(e) =>
                                            setDbTag(e.target.value)
                                        }
                                    ></TextField>
                                </div>
                                <div
                                    style={{
                                        marginBottom: '20px',
                                        color: '#212121',
                                        fontWeight: '600',
                                    }}
                                >
                                    Database
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <TextField
                                        inputRef={delimiterRef}
                                        sx={{ borderRadius: '7px' }}
                                        size="small"
                                        fullWidth
                                        placeholder="Delimiter"
                                        value={delimiter}
                                        onChange={(e) =>
                                            setDelimiter(e.target.value)
                                        }
                                    ></TextField>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    {IsDisabled ? (
                                        <StyledTextField>
                                            Database Type
                                        </StyledTextField>
                                    ) : (
                                        <Select
                                            size="small"
                                            fullWidth
                                            disabled={uploadedFile === null}
                                            value={selectedDbType}
                                            onChange={(e) =>
                                                setSelectedDbType(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {databaseTypeOptions.map(
                                                (option) => (
                                                    <MenuItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </MenuItem>
                                                ),
                                            )}
                                        </Select>
                                    )}
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    {IsDisabled ? (
                                        <StyledTextField>
                                            Metamodel Type
                                        </StyledTextField>
                                    ) : (
                                        <Select
                                            size="small"
                                            fullWidth
                                            value={selectedMetaModelType}
                                            disabled={uploadedFile === null}
                                            onChange={(e) =>
                                                setSelectedMetaModelType(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {metaModelTypeOptions.map(
                                                (option) => (
                                                    <MenuItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </MenuItem>
                                                ),
                                            )}
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </StyledDiv>
                    </StyledDiv>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                        }}
                    >
                        <Button
                            disabled={IsDisabled || formLoading}
                            variant="contained"
                            onClick={onSubmit}
                        >
                            {formLoading ? (
                                <CircularProgress size="1.5em" />
                            ) : (
                                'Next'
                            )}
                        </Button>
                    </div>
                </form>
            ) : (
                <DataSelection
                    files={parsedData}
                    onImport={() => submitMetmodelPixel(parsedData)}
                    onCancel={handleCancel}
                />
            )}
        </>
    );
}

export default CsvImport;
