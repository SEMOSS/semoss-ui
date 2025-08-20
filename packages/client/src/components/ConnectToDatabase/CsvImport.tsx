import { useState } from "react";
import { useRootStore, useStepper } from "@/hooks";
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
} from "@semoss/ui";
import { useNavigate } from "react-router-dom";
import DataSelection from "./DataSelection";
import { MetaModelType } from "./MetaModelType";

const Row = styled("div")(() => ({
  display: "flex",
  width: "100%",
  gap: "25px",
}));

const Column = styled("div")(() => ({
  display: "flex",
  width: "100%",
  gap: "25px",
}));

const LeftPanel = styled("div")(() => ({
  width: "660px",
  height: "375px",
}));

const SectionTitle = styled("div")(() => ({
  marginBottom: "20px",
  color: "#212121",
  fontWeight: 600,
}));

const SectionBlock = styled("div")(() => ({
  marginBottom: "20px",
}));

const DisabledField = styled("div")(() => ({
  cursor: "not-allowed",
  backgroundColor: "#f5f5f5",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  height: "40px",
  border: "1px solid #e0e0e0",
  borderRadius: "7px",
  color: "#9E9E9E",
  padding: "8px",
}));

const RightPanel = styled("div")(() => ({
  width: "100%",
  marginTop: "5px",
}));

const FooterActions = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
}));

function CsvImport() {
  const [step, setStep] = useState<
    "import" | "table" | "metaModel" | "propFile"
  >("import");

  const databaseTypeOptions = [
    { label: "H2", value: "h2" },
    { label: "R", value: "r" },
  ];

  const metaModelTypeOptions = [
    { label: "As Flat Table", value: "asFlatTable" },
    { label: "As Suggested Metamodel", value: "asSuggestedMetaModel" },
    { label: "From Scratch", value: "fromScratch" },
    { label: "From Prop File", value: "frompropFile" },
  ];

  const [formLoading, setFormLoading] = useState(false);
  const [dbName, setDbName] = useState("");
  const [dbDescription, setDbDescription] = useState("");
  const [dbTag, setDbTag] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [uploadedFile, setUploadedFile] = useState<File[]>([]);
  const [selectedDbType, setSelectedDbType] = useState<string>();
  const [selectedMetaModelType, setSelectedMetaModelType] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [filePath, setFilePath] = useState<string>();

  const { monolithStore, configStore } = useRootStore();
  const notification = useNotification();
  const navigate = useNavigate();

  const isDisabled = uploadedFile.length === 0;

  const updateStepBasedOnMetaModel = (metamodelType: string) => {
    if (metamodelType === "asFlatTable" || metamodelType === "fromScratch") {
      setStep("table");
    } else if (metamodelType === "asSuggestedMetaModel") {
      setStep("metaModel");
    } else if (metamodelType === "frompropFile") {
      setStep("propFile");
    } else {
      setStep("import");
    }
  };

  const onFileUpload = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    setUploadedFile((prevFiles) => [...prevFiles, ...fileArray]);
    setSelectedDbType(databaseTypeOptions[0].value);
    setSelectedMetaModelType(metaModelTypeOptions[0].value);
  };

  let filteredMetaModelTypeOptions = metaModelTypeOptions;
  if (selectedDbType === "r") {
    filteredMetaModelTypeOptions = [
      { label: "As Flat Table", value: "asFlatTable" },
    ];
  }

  const onSubmit = async () => {
        if (!dbName || !dbDescription || !dbTag) {
            notification.add({
                color: 'error',
                message: 'Please fill all the required fields.',
            });
            return;
        }

        if (uploadedFile.length === 0) {
            notification.add({
                color: 'error',
                message: 'Please upload at least one file.',
            });
            return;
        }

        setFormLoading(true);

        try {
            const upload = await monolithStore.uploadFile(
                uploadedFile,
                configStore.store.insightID,
            );

            if (!upload || !Array.isArray(upload)) {
                console.error(
                    'Upload failed or returned unexpected format:',
                    upload,
                );
                notification.add({
                    color: 'error',
                    message: 'Upload failed or returned invalid response.',
                });
                setFormLoading(false);
                return;
            }

            let pixelExpressions: string[] = [];

            if (
                selectedMetaModelType === 'asFlatTable' ||
                selectedMetaModelType === 'fromScratch'
            ) {
                pixelExpressions = upload.map(
                    (file) =>
                        `PredictDataTypes(filePath=["${file.fileLocation}"], delimiter=["${delimiter}"], rowCount=[false])`,
                );
            } else if (selectedMetaModelType === 'asSuggestedMetaModel') {
                pixelExpressions = upload.map(
                    (file) =>
                        `PredictMetamodel(filePath=["${file.fileLocation}"], delimiter=["${delimiter}"], rowCount=[false])`,
                );
            } else if (selectedMetaModelType === 'frompropFile') {
                notification.add({
                    color: 'error',
                    message: 'Prop File logic not implemented.',
                });
                setFormLoading(false);
                return;
            }

            const parsedResults: any[] = [];

            for (const pixelString of pixelExpressions) {
                const response = await monolithStore.runQuery(pixelString);
                const output = response?.pixelReturn?.[0]?.output;
                const pixelExpression =
                    response?.pixelReturn?.[0]?.pixelExpression;
                const filePathMatch = pixelExpression?.match(
                    /filePath\s*=\s*\[\s*"(.+?)"\s*\]/,
                );
                const filePathFromExpression = filePathMatch
                    ? filePathMatch[1]
                    : null;
                if (filePathFromExpression) {
                    const name =
                        filePathFromExpression.split(/[/\\]/).pop() || '';
                    setFileName(name);
                }
                setFilePath(filePathFromExpression);                
                parsedResults.push(output);
            }
            setParsedData(parsedResults);
            updateStepBasedOnMetaModel(selectedMetaModelType!);    } catch (error) {
            console.error('Upload error:', error);
            notification.add({
                color: 'error',
                message: 'An error occurred during upload.',
            });
        } finally {
            setFormLoading(false);
        }
    };

  const handleCancel = () => {
    setStep("import");
    setUploadedFile(uploadedFile);
  };

  const watchDatabaseName = dbName;
  const watchFile = filePath;
  const newHeaders: Record<string, any> = {};

  const submitMetamodelPixel = async (parsedData) => {
    if (!parsedData?.length || !parsedData[0]) {
      notification.add({
        color: "error",
        message: "Parsed data is missing or invalid.",
      });
      return;
    }

    const { dataTypes, additionalDataTypes, relation, nodeProp } =
      parsedData[0];
    const logicalNamesMap = {};
    const descriptionMap = {};
    const metamodel = [
      {
        relation,
        nodeProp,
      },
    ];
    const pixel = `
            databaseVar = RdbmsCsvUpload(
                database=["${dbName}"],
                filePath=["${watchFile}"],
                delimiter=["${delimiter}"],
                metamodel=${JSON.stringify(metamodel)},
                newHeaders=[${JSON.stringify(newHeaders)}],
                additionalDataTypes=[${JSON.stringify(additionalDataTypes)}],
                dataTypeMap=[${JSON.stringify(dataTypes)}],
                descriptionMap=[${JSON.stringify(descriptionMap)}],
                logicalNamesMap=[${JSON.stringify(logicalNamesMap)}],
                existing=[false]
            );
            ExtractDatabaseMeta(database=[databaseVar]);
           
        `;
    // SaveOwlPositions(database=[databaseVar],
    // positionMap=[${JSON.stringify(positions)}]);

    const response = await monolithStore.runQuery(pixel);

    const { output, operationType } = response.pixelReturn[0];
    if (operationType.indexOf("ERROR") > -1) {
      notification.add({
        color: "error",
        message: output,
      });

      return;
    } else {
      notification.add({
        color: "success",
        message: "success",
      });
      navigate(`/engine/database/${output.database_id}`);
    }
  };

  const submitTablePixel = async (payloadObject) => {
    const pixel = `RdbmsUploadTableData(
            database=["${watchDatabaseName}"],
            filePath=["${watchFile}"],
            delimiter=["${delimiter}"],
            dataTypeMap=[${JSON.stringify(payloadObject.dataTypeMap)}],
            newHeaders=[${JSON.stringify(payloadObject.newHeaders)}],
            additionalDataTypes=[${JSON.stringify(
              payloadObject.additionalDataTypes
            )}],
            descriptionMap=[${JSON.stringify(payloadObject.descriptionMap)}],
            logicalNamesMap=[${JSON.stringify(payloadObject.logicalNamesMap)}],
            existing=[false]
          );`;

    try {
      const response = await monolithStore.runQuery(pixel);
      const { output, operationType } = response.pixelReturn[0];
      if (operationType.includes("ERROR")) {
        notification.add({
          color: "error",
          message: output,
        });
        return;
      }

      notification.add({
        color: "success",
        message: "Success",
      });

      navigate(`/engine/database/${output.database_id}`);
    } catch (error) {
      notification.add({
        color: "error",
        message: "An error occurred while processing the request.",
      });
      console.error("Error executing query:", error);
    }
  };

  return (
    <>
      {step === "import" && (
        <form>
          <Row>
            <Column>
              <LeftPanel>
                <FileDropzone multiple={true} onChange={onFileUpload} />
              </LeftPanel>
            </Column>
            <Column>
              <RightPanel>
                <SectionTitle>General</SectionTitle>

                <SectionBlock>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter Database Name *"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                  />
                </SectionBlock>

                <SectionBlock>
                  <TextArea
                    fullWidth
                    placeholder="Enter Database Description *"
                    minRows={4}
                    maxRows={12}
                    value={dbDescription}
                    onChange={(e) => setDbDescription(e.target.value)}
                  />
                </SectionBlock>

                <SectionBlock>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder=" Enter Database Tags *"
                    value={dbTag}
                    onChange={(e) => setDbTag(e.target.value)}
                  />
                </SectionBlock>

                <SectionTitle>Database</SectionTitle>

                <SectionBlock>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Delimiter"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                  />
                </SectionBlock>

                <SectionBlock>
                  {isDisabled ? (
                    <DisabledField>Database Type</DisabledField>
                  ) : (
                    <Select
                      size="small"
                      fullWidth
                      disabled={uploadedFile === null}
                      value={selectedDbType}
                      onChange={(e) => setSelectedDbType(e.target.value)}
                    >
                      {databaseTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </SectionBlock>

                <SectionBlock>
                  {isDisabled ? (
                    <DisabledField>Metamodel Type</DisabledField>
                  ) : (
                    <Select
                      size="small"
                      fullWidth
                      value={selectedMetaModelType}
                      onChange={(e) => setSelectedMetaModelType(e.target.value)}
                    >
                      {filteredMetaModelTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </SectionBlock>
              </RightPanel>
            </Column>
          </Row>
          <FooterActions>
            <Button
              disabled={isDisabled || formLoading}
              variant="contained"
              onClick={onSubmit}
            >
              {formLoading ? <CircularProgress size="1.5em" /> : "Next"}
            </Button>
          </FooterActions>
        </form>
      )}
      {step === "table" && parsedData && parsedData.length > 0 && (
        <DataSelection
          files={parsedData}
          fileName={fileName}
          onImport={(payload) => submitTablePixel(payload)}
          onCancel={handleCancel}
        />
      )}
      {step === "metaModel" && parsedData && parsedData.length > 0 && (
        <MetaModelType
          parsedData={parsedData}
          onImport={() => submitMetamodelPixel(parsedData)}
          onCancel={handleCancel}
        />
      )}
      {step === "propFile" && <div>Prop file logic UI goes here</div>}
    </>
  );
}

export default CsvImport;
