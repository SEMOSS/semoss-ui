/** biome-ignore-all lint/complexity/useLiteralKeys: <explanation> */

import { useNavigate } from "react-router-dom";
import { Box, styled, useNotification } from "@semoss/ui";
import { ImportForm } from "@/components/import";
import { useRootStore, useStepper } from "@/hooks";

const StyledBox = styled(Box)({
  boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
  width: "100%",
  padding: "16px 16px 16px 16px",
  marginBottom: "32px",
});

export const ImportConnectionPage = () => {
  const { monolithStore, configStore } = useRootStore();
  const navigate = useNavigate();
  const notification = useNotification();
  const { steps, setIsLoading } = useStepper();
  /**
   *
   * @param values
   * @returns
   * @desc  Based on type of submitted form it will either:
   * 1. Hit the respective reactor to submit
   * 2. Sets next step in process to continue with submission
   * 3. Refactor
   */
  const formSubmit = async (values: {
    type: "VECTOR" | "STORAGE" | "MODEL" | "FUNCTION" | "UPLOAD";
    name: string;
    fields: unknown[];
    secondaryFields?: unknown[];
  }) => {
    // let pixel = ''; // 'VECTOR' | 'STORAGE' | 'MODEL' | 'FUNCTION' | 'UPLOAD'
    setIsLoading(true);
    if (values.type === "STORAGE") {
      /** Storage: START */
      const pixel = `CreateStorageEngine(
                storage=["${values.name}"], 
                storageDetails=[${JSON.stringify(values.fields)}]
            )`;

      monolithStore.runQuery(pixel).then((response) => {
        const output = response.pixelReturn[0].output,
          operationType = response.pixelReturn[0].operationType;

        setIsLoading(false);

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
          return;
        }

        notification.add({
          color: "success",
          message: `Successfully added to catalog storage`,
        });

        navigate(`/engine/storage/${output.database_id}`);
      });

      return;
    } else if (values.type === "MODEL") {
      /** Model: START */
      let pixel: string;
      if (values.secondaryFields["FILE"]) {
        const upload = await monolithStore.uploadFile(
          [values.secondaryFields["FILE"]],
          configStore.store.insightID
        );
        pixel = `CreateModelEngine(
                    model=["${values.name}"], 
                    modelDetails=[${JSON.stringify(values.fields)}],
                    filePaths=["${upload[0].fileLocation}"]
                )`;
      } else {
        pixel = `CreateModelEngine(
                    model=["${values.name}"], 
                    modelDetails=[${JSON.stringify(values.fields)}]
                )`;
      }

      monolithStore.runQuery(pixel).then(async (response) => {
        const output = response.pixelReturn[0].output,
          operationType = response.pixelReturn[0].operationType;

        setIsLoading(false);

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
          return;
        }

        notification.add({
          color: "success",
          message: `Successfully added LLM to catalog`,
        });
        navigate(`/engine/model/${output.database_id}`);
      });
      return;
    } else if (values.type === "VECTOR") {
      /** Vector Database: START */
      const meta: Record<string, string> = {};
      if (values.fields["DESCRIPTION"]) {
        meta["description"] = values.fields["DESCRIPTION"];
      }
      if (values.fields["TAGS"]) {
        meta["tag"] = values.fields["TAGS"];
      }

      // Keep loader true until ALL work is done
      setIsLoading(true);

      const pixel = `
        CreateVectorDatabaseEngine ( 
            database=["${values.name}"], 
            conDetails=[${JSON.stringify(values.fields)}]
        );
    `;

      monolithStore.runQuery(pixel).then(async (response) => {
        const output = response.pixelReturn[0].output;
        const operationType = response.pixelReturn[0].operationType;

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({ color: "error", message: output });
          setIsLoading(false);
          return;
        }
        if (values.secondaryFields["EMBEDDINGS"]) {
          // Upload embeddings first
          const upload = await monolithStore.uploadFile(
            values.secondaryFields["EMBEDDINGS"],
            configStore.store.insightID
          );

          const fileLocations = upload.map((file) => file.fileLocation);

          const secondaryPixel = `CreateEmbeddingsFromDocuments(
                engine="${output.database_id}",
                filePaths=${JSON.stringify(fileLocations)}
            );`;

          monolithStore.runQuery(secondaryPixel).then((response) => {
            const secondaryPixelOutput = response.pixelReturn[0].output;
            const opType = response.pixelReturn[0].operationType;
            setIsLoading(false);
            notification.add({
              color: opType.indexOf("ERROR") > -1 ? "error" : "success",
              message: secondaryPixelOutput,
            });
            navigate(`/engine/vector/${output.database_id}`);
            notification.add({
              color: "success",
              message: `Successfully added vector database to catalog`,
            });
          });
        } else {
          // No embeddings → we can stop loader now
          setIsLoading(false);
          navigate(`/engine/vector/${output.database_id}`);
        }

        if (Object.keys(meta).length !== 0) {
          const thirdPixel = `SetEngineMetadata(
                engine=["${output.database_id}"], 
                meta=[${JSON.stringify(meta)}], 
                jsonCleanup=[true]
            )`;
          monolithStore.runQuery(thirdPixel).then((response) => {
            const thirdPixelOutput = response.pixelReturn[0].output;
            const opType = response.pixelReturn[0].operationType;

            notification.add({
              color: opType.indexOf("ERROR") > -1 ? "error" : "success",
              message:
                opType.indexOf("ERROR") > -1
                  ? thirdPixelOutput
                  : response.pixelReturn[0].additionalOutput[0].output,
            });
          });
        }
      });
      return;
    } else if (values.type === "FUNCTION") {
      /** Function: START */
      let pixel: string;
      if (values.secondaryFields["FILE"]) {
        const upload = await monolithStore.uploadFile(
          [values.secondaryFields["FILE"]],
          configStore.store.insightID
        );
        pixel = `
                    CreateRestFunctionEngine(function=["${
                      values.name
                    }"],functionDetails=[${JSON.stringify(values.fields)}],
                    filePaths=["${upload[0].fileLocation}"]);`;
      } else {
        pixel = `
                    CreateRestFunctionEngine(function=["${
                      values.name
                    }"],functionDetails=[${JSON.stringify(values.fields)}]);`;
      }

      monolithStore.runQuery(pixel).then((response) => {
        const output = response.pixelReturn[0].output,
          operationType = response.pixelReturn[0].operationType;

        setIsLoading(false);

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
          return;
        }

        notification.add({
          color: "success",
          message: `Successfully added function to catalog`,
        });
        navigate(`/engine/function/${output.database_id}`);
      });
      return;
    }

    /** Connect to External: START */
    // I'll be hitting this reactor if dbDriver is in RDBMSTypeEnum on BE
    // if (values.type === 'connect') {
    //     const pixel = `ExternalJdbcTablesAndViews(conDetails=[
    //         ${JSON.stringify(values.conDetails)}
    //     ])`;

    //     const resp = await monolithStore.runQuery(pixel);
    //     const output = resp.pixelReturn[0].output,
    //         operationType = resp.pixelReturn[0].operationType;

    //     setIsLoading(false);

    //     if (operationType.indexOf('ERROR') > -1) {
    //         notification.add({
    //             color: 'error',
    //             message: output,
    //         });
    //     } else {
    //         setMetamodel(output);
    //     }
    //     return;
    // }
    /** Connect to External: END */

    /** Drag and Drop: START */

    // if (values.METAMODEL_TYPE === 'As Suggested Metamodel') {
    //     monolithStore
    //         .uploadFile(values.FILE, insightId)
    //         .then((res: { fileName: string; fileLocation: string }[]) => {
    //             const file = res[0].fileLocation;
    //             monolithStore
    //                 .runQuery(
    //                     `PredictMetamodel(filePath=["${file}"], delimiter=["${values.DELIMETER}"], rowCount=[false])`,
    //                 )
    //                 .then((res) => {
    //                     const output = res.pixelReturn[0].output;
    //                     setIsLoading(false);
    //                     // format response to send to Form
    //                     setMetamodel(output);
    //                 });
    //         });
    // }
    // if (values.METAMODEL_TYPE === 'As Flat Table') {
    //     monolithStore
    //         .uploadFile(values.FILE, insightId)
    //         .then((res: { fileName: string; fileLocation: string }[]) => {
    //             const file = res[0].fileLocation;
    //             monolithStore
    //                 .runQuery(
    //                     `PredictDataTypes(filePath=["${file}"], delimiter=["${values.DELIMETER}"], rowCount=[false])`,
    //                 )
    //                 .then((res) => {
    //                     setIsLoading(false);
    //                     setPredictDataTypes(res);
    //                 });
    //         });
    // }

    /** Drag and Drop: END */
  };

  return (
    <StyledBox>
      <ImportForm
        fields={steps[1].data}
        submitFunc={(vals) => formSubmit(vals)}
      />
    </StyledBox>
  );
};
