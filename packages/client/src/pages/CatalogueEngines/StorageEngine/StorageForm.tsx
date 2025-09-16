import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Box, Radio } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Divider,
  FileDropzone,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  RadioGroup,
  Select,
  Stack,
  styled,
  TextField,
  Typography,
  useNotification,
} from "@semoss/ui";
import { useRootStore, useStepper } from "@/hooks";

const StyledBox = styled(Box)({
  boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
  width: "100%",
  padding: "16px 16px 16px 16px",
  marginBottom: "32px",
  marginTop: "15px",
});

const StyledFlexEnd = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const StyledSubmitButton = styled(Button)({
  textTransform: "capitalize",
  minWidth: "128px",
});

const StyledNoSection = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const SectionContainer = styled(Grid)({
  padding: "20px",
});

const SectionLeft = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  paddingRight: theme.spacing(2),
  width: "40%",
}));

const SectionRight = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "60%",
}));

const AdvancedHeader = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 0),
}));

export const StorageForm = ({ id, title, description, fields }) => {
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const [resolvedFields, setResolvedFields] = useState(fields);

  const { control, handleSubmit, watch, setValue, setFocus } = useForm({
    mode: "onSubmit",
    defaultValues: fields.reduce((acc, f) => {
      acc[f.fieldName] = f.defaultValue || "";
      return acc;
    }, {}),
  });

  const watchedFieldRef = useRef({});
  const { monolithStore, configStore } = useRootStore();
  const notification = useNotification();
  const navigate = useNavigate();
  const { setIsLoading } = useStepper();

  const defaultFields = resolvedFields.filter((f) => !f.advanced);
  const advancedFields = resolvedFields.filter((f) => f.advanced);

  useEffect(() => {
    resolvedFields.forEach((f) => {
      let pixel = f.pixel;
      let optionsPixel = f.options?.pixel;

      fieldsToWatch.forEach((name: keyof typeof watch) => {
        const val = watch(name);
        if (watchedFieldRef.current[name] !== undefined && val) {
          pixel = pixel?.replaceAll(`<${name}>`, val);
          optionsPixel = optionsPixel?.replaceAll(`<${name}>`, val);
        }
      });

      if (pixel && !hasParameterizedValue(pixel)) {
        executeWatchedFieldPixel(f.fieldName, pixel, "value");
      }

      if (optionsPixel && !hasParameterizedValue(optionsPixel)) {
        executeWatchedFieldPixel(f.fieldName, optionsPixel, "options");
      }
    });
  }, []);

  const onFormSubmit = async (formData) => {
    setIsLoading(true);
    try {
      
        if (title === "ZIP") {
          const uploadedFiles = await monolithStore.uploadFile(
            formData.ZIP,
            configStore.store.insightID
          );

          const uploadEnginePixel = `UploadEngine(
          filePath=["${uploadedFiles[0].fileLocation}"], 
          engineTypes=["STORAGE"]
        )`;

          const uploadEngineResponse = await monolithStore.runQuery(
            uploadEnginePixel
          );
          const uploadEngineOutput = uploadEngineResponse.pixelReturn[0].output;
          const uploadEngineOperationType =
            uploadEngineResponse.pixelReturn[0].operationType;

          if (uploadEngineOperationType.includes("ERROR")) {
            notification.add({
              color: "error",
              message: uploadEngineOutput,
            });
            return;
          }

          notification.add({
            color: "success",
            message: `ZIP uploaded successfully`,
          });

          navigate(`/engine/storage/${uploadEngineOutput.database_id}`);
          return;
        }

      const connectionDetails = {};
      const secondaryFieldValues = {};

      fields.forEach((field) => {
        let fieldValue = formData[field.fieldName];
        if (field.options.component === "number") {
          fieldValue = parseInt(fieldValue, 10);
        }
        if (field.secondary) {
          secondaryFieldValues[field.fieldName] = fieldValue;
        } else {
          connectionDetails[field.fieldName] = fieldValue;
        }
      });

      const storageFormValues = {
        type: "STORAGE",
        name: formData.NAME,
        fields: connectionDetails,
        secondaryFields: secondaryFieldValues,
      };

      const createStoragePixel = `CreateStorageDatabaseEngine(
      database=["${storageFormValues.name}"], 
      conDetails=[${JSON.stringify(storageFormValues.fields)}]
    );`;

      const createStorageResponse = await monolithStore.runQuery(
        createStoragePixel
      );
      const createStorageOutput = createStorageResponse.pixelReturn[0].output;
      const createStorageOperationType =
        createStorageResponse.pixelReturn[0].operationType;

      if (createStorageOperationType.includes("ERROR")) {
        notification.add({
          color: "error",
          message: createStorageOutput,
        });
        return;
      }

      notification.add({
        color: "success",
        message: `Successfully added storage database to catalog`,
      });

      const storageDatabaseId = createStorageOutput.database_id;

      if (storageFormValues.secondaryFields["EMBEDDINGS"]) {
        const uploadedEmbeddingFiles = await monolithStore.uploadFile(
          storageFormValues.secondaryFields["EMBEDDINGS"],
          configStore.store.insightID
        );

        const embeddingFileLocations = uploadedEmbeddingFiles.map(
          (file) => file.fileLocation
        );

        const embeddingsPixel = `CreateEmbeddingsFromDocuments(
        engine="${storageDatabaseId}", 
        filePaths=${JSON.stringify(embeddingFileLocations)}
      );`;

        const embeddingsResponse = await monolithStore.runQuery(
          embeddingsPixel
        );
        const embeddingsOperationType =
          embeddingsResponse.pixelReturn[0].operationType;

        notification.add({
          color:
            embeddingsResponse.pixelReturn?.[0]?.operationType?.indexOf(
              "ERROR"
            ) > -1
              ? "error"
              : "success",
          message: "Failed to add embeddings to storage database",
        });
        notification.add({
          color: "success",
          message: `Successfully added storage database to catalog`,
        });

        if (embeddingsOperationType.includes("ERROR")) {
          return;
        }
      }

      const engineMetadata = {};
      if (storageFormValues.fields["DESCRIPTION"]) {
        engineMetadata["description"] = storageFormValues.fields["DESCRIPTION"];
      }
      if (storageFormValues.fields["TAGS"]) {
        engineMetadata["tag"] = storageFormValues.fields["TAGS"];
      }

      if (Object.keys(engineMetadata).length > 0) {
        const metadataPixel = `SetEngineMetadata(
        engine=["${storageDatabaseId}"], 
        meta=[${JSON.stringify(engineMetadata)}], 
        jsonCleanup=[true]
      );`;

        const metadataResponse = await monolithStore.runQuery(metadataPixel);
        const metadataOperationType =
          metadataResponse.pixelReturn[0].operationType;
        const metadataOutput = metadataResponse.pixelReturn[0].output;

        notification.add({
          color: metadataOperationType.includes("ERROR") ? "error" : "success",
          message: metadataOutput,
        });

        if (metadataOperationType.includes("ERROR")) {
          return;
        }
      }

      navigate(`/engine/storage/${storageDatabaseId}`);
    } catch (error) {
      notification.add({
        color: "error",
        message: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsToWatch = useMemo(() => {
    const f2w = fields.reduce((acc, f) => {
      if (f.pixel) {
        const matches = f.pixel.match(/<([^>]+)>/g);
        if (matches) {
          acc.push(...matches.map((m) => m.replace(/[<>]/g, "")));
        }
      }
      if (f.options?.pixel) {
        const matches = f.options.pixel.match(/<([^>]+)>/g);
        if (matches) {
          acc.push(...matches.map((m) => m.replace(/[<>]/g, "")));
        }
      }
      return acc;
    }, []);
    return Array.from(new Set(f2w));
  }, [fields]);

  const hasParameterizedValue = (str) => /<([^>]+)>/.test(str);

  const executeWatchedFieldPixel = async (fieldName, pixelStr, type) => {
    const response = await monolithStore.runQuery(pixelStr);
    const output = response.pixelReturn[0].output;
    const operationType = response.pixelReturn[0].operationType;

    if (operationType.includes("ERROR")) {
      notification.add({ color: "error", message: output });
      return;
    }

    if (type === "value") {
      setValue(fieldName, output);
      return;
    }

    if (type === "options") {
      setResolvedFields((prev) =>
        prev.map((f) =>
          f.fieldName === fieldName
            ? {
                ...f,
                options: {
                  ...f.options,
                  options: output.map((opt) => ({
                    display: opt[f.options.optionDisplay],
                    value: opt[f.options.optionValue],
                  })),
                },
              }
            : f
        )
      );
    }
  };

  const validateFormField = async (field, userInput) => {
    if (!field.rules?.custom?.value) return true;
    const pixelToExecute = field.rules.custom.value.replace(
      "[VALUE]",
      userInput
    );

    const response = await monolithStore.runQuery(pixelToExecute);
    const output = response.pixelReturn[0].output;
    const operationType = response.pixelReturn[0].operationType;

    if (operationType.includes("ERROR")) {
      notification.add({ color: "error", message: output });
      return false;
    }

    if (output.exists) {
      setFocus(field.fieldName);
      return false;
    }

    return true;
  };

  const checkForDisplayRulesSet = (field, value) => {
    const selectedDefaultField = resolvedFields.find(
      (f) => f.fieldName === field.name
    );
    if (selectedDefaultField?.displayRules?.hideOtherFields) {
      selectedDefaultField.displayRules.hideOtherFields.forEach((fth) => {
        const optionValue = fth.value;
        setResolvedFields((prev) =>
          prev.map((f) =>
            f.fieldName === fth.fieldName
              ? { ...f, hidden: optionValue.includes(value) }
              : f
          )
        );
      });
    }
  };

  const renderControllerField = (val) => (
    <Controller
      key={val.fieldName}
      name={val.fieldName}
      control={control}
      rules={{
        required: val.rules?.required,
        pattern: val.rules?.pattern,
        validate: val.rules?.custom && {
          checkField: async (fieldVal) => validateFormField(val, fieldVal),
        },
      }}
      render={({ field, fieldState: { error } }) => {
        switch (val.options.component) {
          case "text-field":
            return (
              <TextField
                {...field}
                fullWidth
                label={val.label}
                disabled={val.disabled}
                required={val.rules?.required}
                error={!!error}
                helperText={getHelperText(error, val)}
                data-testid={`storage-form-input-${val.fieldName}`}
              />
            );

          case "password":
            return (
              <TextField
                {...field}
                type="password"
                fullWidth
                label={val.label}
                disabled={val.disabled}
                required={val.rules?.required}
                error={!!error}
                helperText={getHelperText(error, val)}
                data-testid={`storage-form-input-${val.fieldName}`}
              />
            );

          case "number":
            return (
              <TextField
                {...field}
                type="number"
                fullWidth
                label={val.label}
                disabled={val.disabled}
                required={val.rules?.required}
                error={!!error}
                helperText={getHelperText(error, val)}
                data-testid={`storage-form-input-${val.fieldName}`}
              />
            );

          case "select":
            return (
              <Select
                {...field}
                fullWidth
                label={val.label}
                disabled={val.disabled}
                required={val.rules?.required}
                error={!!error}
                helperText={getHelperText(error, val)}
                onChange={(e) => {
                  field.onChange(e);
                  checkForDisplayRulesSet(field, e.target.value);
                }}
                data-testid={`storage-form-input-${val.fieldName}`}
              >
                {val?.options?.options?.map((opt) => (
                  <Menu.Item
                    key={opt.value}
                    value={opt.value}
                    data-testid={`storage-form-option-${val.fieldName}-${opt.value}`}
                  >
                    {opt.display}
                  </Menu.Item>
                ))}
              </Select>
            );

          case "radio":
            return (
              <RadioGroup
                row
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                data-testid={`storage-form-input-${val.fieldName}`}
              >
                {val.options.options.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={
                      <Radio
                        data-testid={`storage-form-radio-${val.fieldName}-${opt.value}`}
                      />
                    }
                    label={opt.display}
                  />
                ))}
                {error && (
                  <Typography variant="caption" color="error">
                    {getHelperText(error, val)}
                  </Typography>
                )}
              </RadioGroup>
            );

          case "file-upload":
            return (
              <>
                <FileDropzone
                  multiple
                  value={field.value || []}
                  disabled={val.disabled}
                  extensions={[
                    ".pdf",
                    ".txt",
                    ".doc",
                    ".ppt",
                  ]}
                  onChange={(v) => field.onChange(v)}
                  data-testid={`storage-form-input-${val.fieldName}`}
                />
                {error && (
                  <Typography
                    variant="body1"
                    color="red"
                    data-testid={`storage-form-error-${val.fieldName}`}
                  >
                    {getHelperText(error, val)}
                  </Typography>
                )}
              </>
            );

          case "zip-upload":
            return (
              <>
                <FileDropzone
                  multiple
                   value={field.value || []}
                  disabled={val.disabled}
                  onChange={(newValues) => field.onChange(newValues)}
                  data-testid={`storage-form-input-${val.fieldName}`}
                />
                {error && (
                  <Typography
                    variant="caption"
                    color="error"
                    data-testid={`storage-form-error-${val.fieldName}`}
                  >
                    {getHelperText(error, val)}
                  </Typography>
                )}
              </>
            );

          case "checkbox":
            return (
              <>
                <Checkbox
                  required={val.rules.required}
                  label={val.label}
                  disabled={val.disabled}
                  checked={field.value ? field.value : false}
                  onChange={(value) => field.onChange(value)}
                  data-testid={`storage-form-input-${val.fieldName}`}
                />
                {error && (
                  <Typography
                    variant="body1"
                    color="red"
                    sx={{ mt: 0.5, display: "block" }}
                    data-testid={`storage-form-error-${val.fieldName}`}
                  >
                    {error.message}
                  </Typography>
                )}
              </>
            );

          default:
            return null;
        }
      }}
    />
  );
  const getHelperText = (error, val) => {
    if (!error) return val.helperText || "";
    if (error.type === "checkField" && val.rules?.custom?.message) {
      return val.rules.custom.message;
    }
    return error.message;
  };

  const SECTION_ORDER = Array.from(
    new Set<string>(
      defaultFields.map((f) => f.section?.toLowerCase()).filter(Boolean)
    )
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} data-testid="storage-form">
      <Typography variant="h4" data-testid="storage-form-title">
        {title}
      </Typography>
      <Typography variant="body1" data-testid="storage-form-description">
        {description}
      </Typography>

      <StyledBox data-testid="storage-form-box">
        <Stack rowGap={4}>
          {SECTION_ORDER.map((sectionKey) => {
            const sectionFields = defaultFields.filter(
              (f) => f.section?.toLowerCase() === sectionKey
            );
            if (!sectionFields.length) return null;

            const sectionDesc = sectionFields[0]?.sectiondescription || "";

            return (
              <div
                data-testid={`storage-form-section-${sectionKey}`}
                key={sectionKey}
              >
                <SectionContainer container spacing={2}>
                  <SectionLeft>
                    <Typography
                      variant="h6"
                      gutterBottom
                      data-testid={`storage-form-section-title-${sectionKey}`}
                    >
                      {sectionKey.toUpperCase()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      data-testid={`storage-form-section-desc-${sectionKey}`}
                    >
                      {sectionDesc}
                    </Typography>
                  </SectionLeft>
                  <SectionRight
                    data-testid={`storage-form-section-fields-${sectionKey}`}
                  >
                    {sectionFields.map((val) => (
                      <div
                        key={val.fieldName}
                        data-testid={`storage-form-field-${val.fieldName}`}
                      >
                        {renderControllerField(val)}
                      </div>
                    ))}
                  </SectionRight>
                </SectionContainer>
                <Divider
                  data-testid={`storage-form-section-divider-${sectionKey}`}
                />
              </div>
            );
          })}

          {defaultFields.filter((f) => !f.section).length > 0 && (
            <SectionContainer data-testid="storage-form-no-section">
              {defaultFields
                .filter((f) => !f.section)
                .map((val) => (
                  <StyledNoSection
                    key={val.fieldName}
                    data-testid={`storage-form-field-${val.fieldName}`}
                  >
                    <Typography variant="body1">{val.label}</Typography>
                    {renderControllerField(val)}
                  </StyledNoSection>
                ))}
            </SectionContainer>
          )}

          {advancedFields.length ? (
            <>
              <AdvancedHeader data-testid="storage-form-advanced-header">
                <Typography variant="body1">ADVANCED SETTINGS</Typography>
                <IconButton
                  onClick={() => setOpenAdvanced(!openAdvanced)}
                  data-testid="storage-form-advanced-toggle"
                >
                  {openAdvanced ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </AdvancedHeader>

              {openAdvanced &&
                advancedFields.map((val) => (
                  <div
                    key={val.fieldName}
                    data-testid={`storage-form-field-${val.fieldName}`}
                  >
                    {renderControllerField(val)}
                  </div>
                ))}
            </>
          ) : null}
        </Stack>

        <StyledFlexEnd data-testid="storage-form-actions">
          <StyledSubmitButton
            type="submit"
            variant="contained"
            data-testid="storage-form-submit"
          >
            Create Storage
          </StyledSubmitButton>
        </StyledFlexEnd>
      </StyledBox>
    </form>
  );
};
