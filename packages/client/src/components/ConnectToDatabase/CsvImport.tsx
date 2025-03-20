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
import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataSelection from './DataSelection';
import { useForm, Controller } from 'react-hook-form';

type Props = {};

function CsvImport({}: Props) {
    const StyledSelect = styled(Button)(() => ({
        cursor: 'not-allowed',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        height: '40px',
        border: '1px solid #e0e0e0',
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
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [selectedDbType, setSelectedDbType] = useState<string>();
    const [selectedMetaModelType, setSelectedMetaModelType] =
        useState<string>();
    const { monolithStore, configStore } = useRootStore();
    const [parsedData, setParsedData] = useState<any>(null);
    const [filePath, setfilePath] = useState<string>();
    const notification = useNotification();
    const { steps } = useStepper();
    const navigate = useNavigate();
    const IsDisabled = uploadedFile === null;
    const onFileUpload = (files: File | File[]) => {
        const fileArray = Array.isArray(files) ? files : [files];
        const file = fileArray.length > 0 ? fileArray[0] : null;
        setUploadedFile(file);
        setSelectedDbType(databaseTypeOptions[0].value);
        setSelectedMetaModelType(metaModelTypeOptions[0].value);
    };

    const onSubmit = async () => {
        if (!dbName) {
            notification.add({
                color: 'error',
                message: 'Please Enter Database Name',
            });
            return;
        }
        setFormLoading(true);
        try {
            const upload = await monolithStore.uploadFile(
                [uploadedFile],
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
    const delimiter = ',';

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

        //pixel += `ExtractDatabaseMeta(database=[${watchDatabaseName}]);`;

        try {
            const response = await monolithStore.runQuery(pixel);
            const { output, additionalOutput, operationType } =
                response.pixelReturn[0];
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
                    <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Enter Database Name:
                                <span style={{ color: 'red' }}>*</span>
                            </div>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Database Name"
                                value={dbName}
                                onChange={(e) => setDbName(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Enter Database Description:
                            </div>
                            <TextArea
                                fullWidth
                                placeholder="Database Description"
                                minRows={4}
                                maxRows={12}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Enter Database Tags:
                            </div>
                            <Select size="small" fullWidth value="">
                                <MenuItem value="" disabled>
                                    Select an option
                                </MenuItem>
                            </Select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Select File(s):
                                <span style={{ color: 'red' }}>*</span>
                            </div>
                            <FileDropzone
                                multiple={false}
                                onChange={onFileUpload}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Database Type:
                            </div>
                            {IsDisabled ? (
                                <StyledSelect
                                    size="small"
                                    fullWidth
                                    disabled={uploadedFile === null}
                                ></StyledSelect>
                            ) : (
                                <Select
                                    size="small"
                                    fullWidth
                                    disabled={uploadedFile === null}
                                    value={selectedDbType}
                                    onChange={(e) =>
                                        setSelectedDbType(e.target.value)
                                    }
                                >
                                    {databaseTypeOptions.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div
                                style={{
                                    color: 'rgb(92, 92, 92)',
                                    fontWeight: '600',
                                }}
                            >
                                Metamodel Type:
                            </div>

                            {IsDisabled ? (
                                <StyledSelect
                                    size="small"
                                    fullWidth
                                    disabled={uploadedFile === null}
                                ></StyledSelect>
                            ) : (
                                <Select
                                    size="small"
                                    fullWidth
                                    value={selectedMetaModelType}
                                    disabled={uploadedFile === null}
                                    onChange={(e) =>
                                        setSelectedMetaModelType(e.target.value)
                                    }
                                >
                                    {metaModelTypeOptions.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </div>
                        <div style={{ color: 'red' }}>* are required</div>
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
