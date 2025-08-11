import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FileDropzone,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  styled,
  TextField,
  useNotification,
} from "@semoss/ui";
import { useRootStore, useStepper } from "@/hooks";

const initialState = {
  defaultFields: [],
  advancedFields: [],
};

const StyledKeyValue = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const FormRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
});
const FormLabelBlock = styled(Box)({
  width: "35%",
  display: "flex",
  flexDirection: "column",
});
const FormInputBlock = styled(Box)({
  width: "65%",
});
const FlexEndBox = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
});
const SectionTitle = styled(Box)(({ theme }) => ({
  fontWeight: "bold",
  ...theme.typography.h6,
}));
const SectionDescription = styled(Box)(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const StyledFileUploadSection = styled("div")({
  width: "100%",
});

const reducer = (state, action) => {
  switch (action.type) {
    case "field": {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
  }
  return state;
};

export const ImportForm = (props) => {
  const { submitFunc, fields } = props;
  const { steps, setSteps } = useStepper();
  const notification = useNotification();
  const { monolithStore, configStore } = useRootStore();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { defaultFields, advancedFields } = state;
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [initScriptCallback, setInitScriptCallback] = useState(null);
  const [updateFieldName, setUpdateFieldName] = useState("");
  const watchedFieldRef = useRef({});
  //** Using onsubmit mode to stop field validation onChange -> limit pixel calls */
  const { control, handleSubmit, reset, watch, setValue, getValues } =
    useForm();

  /** Used to Trigger useEffect anytime these vals change */
  const fieldsToWatch = useMemo(() => {
    const f2w = [];
    for (const f of fields) {
      if (f.pixel) {
        const pixelParams = f.pixel.match(/<([^>]+)>/g);
        if (pixelParams) {
          pixelParams.forEach((p) => {
            const strippedVal = p.replace(/[<>]/g, "");
            f2w.push(strippedVal);
          });
        }
      }
      if (f.options.pixel) {
        const pixelParams = f.options.pixel.match(/<([^>]+)>/g);
        if (pixelParams) {
          pixelParams.forEach((p) => {
            const strippedVal = p.replace(/[<>]/g, "");
            f2w.push(strippedVal);
          });
        }
      }
    }
    return f2w;
  }, [fields]);

  const dynamicFieldsToWatch = useMemo(() => {
    const f2w = [];
    for (const f of fields) {
      if (f.updateValueFieldsToWatch?.length) {
        f.updateValueFieldsToWatch.forEach((f) => {
          f2w.push(f);
        });
      }
    }
    return f2w;
  }, [fields]);

  /**
   * Set Form Fields State
   * 1. Set Default values with react hook form
   * 2. Splits out Advanced and Default fields
   */
  useEffect(() => {
    setInitialFieldState();
  }, [steps.length]);

  /**
   * Anytime a watched field changes trigger this
   * to call the reactor that dependsOn that field
   */
  useEffect(() => {
    // console.warn('WATCHED FIELD CHANGED');
    const destructuredFieldRefs = Object.entries(watchedFieldRef.current);

    if (!destructuredFieldRefs.length) {
      setNewWatchedFieldReferences();
      return;
    } else {
      // 1. Loop through default fields
      defaultFields.forEach((f) => {
        checkFieldParamsAndExecutePixel(f);
      });

      // 2. Loop through advanced fields
      advancedFields.forEach((f) => {
        checkFieldParamsAndExecutePixel(f);
      });

      // 3. Set Reference of fields for next useEffect so we only call pixels that are affected
      setNewWatchedFieldReferences();
    }
  }, [...fieldsToWatch.map((field) => watch(field)), dynamicFieldsToWatch]);

  /**
   * Anytime watched input fields defined in constants changes trigger this
   * Checks to see that update callback has been loaded
   * Creates params object with all watched input field names and current values
   * Passes params object to update callback from import.constants.ts
   * Removes whitespace from new init script string
   * Updates init script field value
   */
  useEffect(() => {
    if (!initScriptCallback) return;
    const mappedValuesObject = dynamicFieldsToWatch.reduce(
      (acc, fieldName) => ({ ...acc, [fieldName]: getValues(fieldName) }),
      {}
    );

    const newInitScript = initScriptCallback(mappedValuesObject);
    const newInitScriptSpacesTrimmed = newInitScript.replace(/\s+/g, " ");
    setValue(updateFieldName, newInitScriptSpacesTrimmed);

    // additionally run this after update callback is initially loaded to populate script field
  }, [
    ...dynamicFieldsToWatch.map((field) => watch(field)),
    initScriptCallback,
  ]);

  /**
   * This runs on input changes to check if the user has changed a dynamically updated field manually
   * It sets a flag that will stop dynamic update from running if the user has manually changed it
   * Allows the user to manually change the field back to re-enable dynamic updates
   */

  /**
   * On init load of default values iterate and look for updateCallback
   * If it is present set it in useState var along with field name to be updated
   * May be combinable with another useEffect
   */
  useEffect(() => {
    defaultFields.forEach((val) => {
      if (val.updateCallback) {
        setUpdateFieldName(val.fieldName);
        setInitScriptCallback(
          () =>
            (...args) =>
              val.updateCallback(...args)
        );
      }
    });
  }, [defaultFields]);

  /**
   * 1. Set Default values for all fields, if default value is present
   * 2. Field uses a pixel to populate default value,
   * - a. call that pixel if no dependent param vals are present in pixel
   * 3. Set options for fields that use pixel to show dropdown options
   */
  const setInitialFieldState = async () => {
    const defaultVals = {};
    const defFields = [];
    const advFields = [];

    for (const f of fields) {
      const finalFieldState = f;

      // 1. Set default vals for field
      defaultVals[finalFieldState.fieldName] = finalFieldState.defaultValue;

      if (finalFieldState.pixel || finalFieldState.options.pixel) {
        let pixelToExecute = "";

        // 2. Add to Pixel string for default value
        if (finalFieldState.pixel) {
          const pixelParams = finalFieldState.pixel.match(/<([^>]+)>/g);

          // 2a. No dependent param vals for pixel
          if (!pixelParams) {
            pixelToExecute += finalFieldState.pixel;
          } else {
            if (finalFieldState.advanced) {
              advFields.push(finalFieldState);
            } else {
              defFields.push(finalFieldState);
            }
            continue;
          }
        }

        // 3. Add to Pixel String to get options for field dropdown
        if (finalFieldState.options.pixel) {
          const pixelParams = finalFieldState.options.pixel.match(/<([^>]+)>/g);
          if (!pixelParams) {
            pixelToExecute += finalFieldState.options.pixel;
          } else {
            if (finalFieldState.advanced) {
              advFields.push(finalFieldState);
            } else {
              defFields.push(finalFieldState);
            }
            continue;
          }
        }

        // If no pixel to execute
        if (!pixelToExecute) {
          continue;
        }

        const result = await monolithStore.runQuery(pixelToExecute);

        let output = result.pixelReturn[0].output,
          operationType = result.pixelReturn[0].operationType;

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
        }

        if (finalFieldState.pixel && !finalFieldState.options.pixel) {
          // Populating default value for field
          defaultVals[finalFieldState.fieldName] = output;
        } else if (!finalFieldState.pixel && finalFieldState.options.pixel) {
          // Populating dropdown options for field
          const opts = [];
          output.forEach((opt) => {
            opts.push({
              display: opt[`${finalFieldState.options.optionDisplay}`],
              value: opt[`${finalFieldState.options.optionValue}`],
            });
          });

          finalFieldState.options = {
            ...f.options,
            options: opts,
          };
        } else {
          // Populating default value and options for field
          defaultVals[finalFieldState.fieldName] = output;

          output = result.pixelReturn[1].output;
          operationType = result.pixelReturn[1].operationType;
          const opts = [];

          output.forEach((opt) => {
            opts.push({
              display: opt.database_name,
              value: opt.database_id,
            });
          });

          finalFieldState.options = {
            ...f.options,
            options: opts,
          };
        }
      }

      if (finalFieldState.advanced) {
        advFields.push(finalFieldState);
      } else {
        defFields.push(finalFieldState);
      }
    }

    dispatch({
      type: "field",
      field: "defaultFields",
      value: defFields,
    });

    dispatch({
      type: "field",
      field: "advancedFields",
      value: advFields,
    });

    reset(defaultVals);
  };

  const executeWatchedFieldPixel = async (
    fieldName,
    pixel: string,
    type: "value" | "options"
  ) => {
    const response = await monolithStore.runQuery(pixel);
    const output = response.pixelReturn[0].output,
      operationType = response.pixelReturn[0].operationType;

    if (operationType.indexOf("ERROR") > -1) {
      notification.add({
        color: "error",
        message: output,
      });
      return;
    }

    if (type === "value") {
      setValue(fieldName, output);
    } else {
      const output = [
        { display: "ERROR: FORMAT OUTPUT VALUES", value: "ERROR" },
      ];
      let defaultFieldIndex = -1;
      defaultFields.forEach((f, i) => {
        if (f.fieldName === fieldName) {
          defaultFieldIndex = i;
        }
      });

      if (defaultFieldIndex > -1) {
        const copy = defaultFields;
        copy[defaultFieldIndex].options.options = output;

        dispatch({
          type: "field",
          field: "defaultFields",
          value: copy,
        });
      }

      let advancedFieldIndex = -1;
      advancedFields.forEach((f, i) => {
        if (f.fieldName === fieldName) {
          advancedFieldIndex = i;
        }
      });

      if (advancedFieldIndex > -1) {
        const copy = advancedFields;
        copy[advancedFieldIndex].options.options = output;

        dispatch({
          type: "field",
          field: "advancedFields",
          value: copy,
        });
      }
    }
  };

  /**
   * @desc Takes details from submission form and
   * constucts values to parent for submission
   * @param data
   * Refactor:  This should only handle the distribution of data
   * OnSubmit Function will handle Adding of Step or Pixel Call
   * Also: type this out
   */
  const onSubmit = async (data) => {
    setFormLoading(true);
    // If it's a File Upload
    if (steps[1].id.includes("File Uploads")) {
      if (steps[1].title === "ZIP") {
        const upload = await monolithStore.uploadFile(
          data.ZIP,
          configStore.store.insightID
        );

        const pixelString =
          steps[0].data === "DATABASE"
            ? `UploadDatabase(filePath=["${upload[0].fileLocation}"])`
            : `UploadEngine(filePath=["${upload[0].fileLocation}"], engineTypes=["${steps[0].data}"])`;

        const response = await monolithStore.runQuery(pixelString);
        const output = response.pixelReturn[0].output,
          operationType = response.pixelReturn[0].operationType;

        if (operationType.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
          setFormLoading(false);
          return;
        }

        navigate(`/engine/${(steps[0].data as string).toUpperCase()}`);
        return;
      }
      setFormLoading(false);
      return;
    }

    // If its one of the other engines that just has an input form and done
    if (steps[0].data === "DATABASE") {
      // Add new step for connection details for metamodeling
      // 1. set another step for connection details, this will trigger a page change
      setSteps(
        [
          ...steps,
          {
            title: data.NAME,
            description:
              "View and edit the relationships of the selected tables from the external connection that was made.",
            data: data,
          },
        ],
        steps.length + 1
      );
    } else {
      const connectionDetails = {};
      const secondaryFields = {};

      fields.forEach((f) => {
        let fieldValue = data[f.fieldName];

        if (f.options.component === "number") {
          fieldValue = parseInt(fieldValue);
        }

        if (f.secondary) {
          secondaryFields[f.fieldName] = fieldValue;
        } else {
          connectionDetails[f.fieldName] = fieldValue;
        }
      });

      const formVals = {
        // 'MODEL' | "VECTOR" | "FUNCTION" | "STORAGE" | "DATABASE"
        type: steps[0].data,
        // Name of engine
        name: data.NAME,
        fields: connectionDetails,
        secondaryFields: secondaryFields,
      };

      submitFunc(formVals);
    }
    setFormLoading(false);
  };

  /**
   * ---------------------------
   * Helpers -------------------
   * ---------------------------
   */

  /**
   * 1. if f.pixel or fields.options.pixel hold respective pixel as constant to execute where we replace param vals
   * 2. Loop through fieldsToWatch
   * -- 2a. if f.pixel.match(<'VALUE'>) replace it with form val
   * 3. if either of those pixels held as constant has no param blockers this means pixel can be executed
   * @param f
   */
  const checkFieldParamsAndExecutePixel = (f) => {
    let pixel = f.pixel;
    let optionsPixel = f.options.pixel;

    if (pixel) {
      if (hasParameterizedValue(pixel)) {
        let pixelParamChanged = false;
        fieldsToWatch.forEach((fieldName) => {
          const val = watch(fieldName);
          if (watchedFieldRef.current[fieldName] !== undefined && val) {
            // A watched value changed from what it was before
            if (val !== watchedFieldRef.current[fieldName]) {
              pixelParamChanged = true;
            }
            pixel = pixel.replaceAll(`<${fieldName}>`, val);
          }
        });

        // Execute pixel if dependency changed and there aren't any params in string
        if (!hasParameterizedValue(pixel) && pixelParamChanged) {
          executeWatchedFieldPixel(f.fieldName, pixel, "value");
        }
      }
    }

    if (optionsPixel) {
      if (hasParameterizedValue(optionsPixel)) {
        let pixelParamChanged = false;
        fieldsToWatch.forEach((fieldName) => {
          const val = watch(fieldName);
          if (watchedFieldRef.current[fieldName] !== undefined && val) {
            // A watched value changed from what it was before
            if (val !== watchedFieldRef.current[fieldName]) {
              pixelParamChanged = true;
            }
            optionsPixel = optionsPixel.replaceAll(`<${fieldName}>`, val);
          }
        });

        // Execute pixel if dependency changed and there aren't any params in string
        if (!hasParameterizedValue(optionsPixel) && pixelParamChanged) {
          executeWatchedFieldPixel(f.fieldName, optionsPixel, "options");
        }
      }
    }
  };

  /**
   * Sets new Reference Value of field
   */
  const setNewWatchedFieldReferences = () => {
    fieldsToWatch.forEach((fieldName) => {
      const val = watch(fieldName);

      watchedFieldRef.current[fieldName] = val;
    });
  };

  /**
   *
   * @param inputString
   * @returns
   */
  function hasParameterizedValue(inputString) {
    // Define a regular expression to match any value within "<>"
    const regex = /<([^>]+)>/;

    // Test if the input string matches the pattern
    return regex.test(inputString);
  }

  /**
   * Check if custom validation is needed
   * @params form field and user input
   * @returns boolean
   */
  /**
   * @desc Checks if the field has display rules set
   * If it does, it will hide other fields based on the value of the field
   * @param field
   * @param value
   */

  // Field-check logic
  const hasOnlyUploadFields = (fields) =>
    fields.every((f) =>
      ["file-upload", "zip-upload"].includes(f.options?.component)
    );
  const hasMixedFields = (fields) =>
    fields.some(
      (f) => !["file-upload", "zip-upload"].includes(f.options?.component)
    ) &&
    fields.some((f) =>
      ["file-upload", "zip-upload"].includes(f.options?.component)
    );
  const onlyUploads = hasOnlyUploadFields(defaultFields);
  const mixedFields = hasMixedFields(defaultFields);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {(() => {
        if (onlyUploads) {
          // Upload-only mode
          return (
            <Grid container spacing={2}>
              {defaultFields.map((f) => (
                <Grid item xs={12} key={f.fieldName}>
                  <Controller
                    name={f.fieldName}
                    control={control}
                    rules={f.rules}
                    render={({ field: fld }) => (
                      <StyledFileUploadSection>
                        <FileDropzone
                          multiple
                          value={fld.value || f.value}
                          onChange={(v) => fld.onChange(v)}
                        />
                      </StyledFileUploadSection>
                    )}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <FlexEndBox>
                  <Button
                    disabled={formLoading}
                    type="submit"
                    variant="contained"
                  >
                    {formLoading ? <CircularProgress size="1.5em" /> : "Upload"}
                  </Button>
                </FlexEndBox>
              </Grid>
            </Grid>
          );
        }

        if (mixedFields) {
          return (
            <Stack spacing={4}>
              {/* Hosting Mode */}
              <FormRow>
                <FormLabelBlock>
                  <SectionTitle>Select Hosting Mode</SectionTitle>
                  <SectionDescription>
                    Choose between commercially hosted or locally hosted modes.
                  </SectionDescription>
                </FormLabelBlock>
                <FormInputBlock
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    ml: 3,
                  }}
                >
                  <Controller
                    name="HOSTING_MODE"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel
                          value="commercial"
                          control={<Radio label={""} />}
                          label="Commercially Hosted"
                        />
                        <FormControlLabel
                          value="local"
                          control={<Radio label={""} />}
                          label="Locally Hosted"
                        />
                      </RadioGroup>
                    )}
                  />
                </FormInputBlock>
              </FormRow>
              <Divider />

              {/* General Section */}
              <FormRow>
                <FormLabelBlock>
                  <SectionTitle>General</SectionTitle>
                  <SectionDescription>
                    Provide name, type, and model to identify and configure.
                  </SectionDescription>
                </FormLabelBlock>
                <FormInputBlock>
                  <Grid container spacing={2}>
                    {defaultFields.slice(0, 1).map((f) => (
                      <Grid item xs={12} key={f.fieldName}>
                        <Controller
                          name={f.fieldName}
                          control={control}
                          rules={f.rules}
                          render={({ field: fld, fieldState: fs }) =>
                            f.options?.component === "select" ? (
                              <FormControl fullWidth error={!!fs.error}>
                                <Select
                                  label={f.label}
                                  value={fld.value || ""}
                                  onChange={fld.onChange}
                                  required={f.rules?.required}
                                >
                                  {(f.options.options || []).map((opt) => (
                                    <MenuItem
                                      key={opt.i}
                                      value={opt[f.options.optionValue]}
                                    >
                                      {opt[f.options.optionDisplay]}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <TextField
                                fullWidth
                                label={f.label}
                                value={fld.value || ""}
                                onChange={fld.onChange}
                                required={f.rules?.required}
                                error={!!fs.error}
                                helperText={fs.error?.message || f.helperText}
                              />
                            )
                          }
                        />
                      </Grid>
                    ))}
                    {defaultFields.slice(1, 3).map((f) => (
                      <Grid item xs={6} key={f.fieldName}>
                        <Controller
                          name={f.fieldName}
                          control={control}
                          rules={f.rules}
                          render={({ field: fld, fieldState: fs }) =>
                            f.options?.component === "select" ? (
                              <FormControl fullWidth error={!!fs.error}>
                                <Select
                                  label={f.label}
                                  value={fld.value || ""}
                                  onChange={fld.onChange}
                                  required={f.rules?.required}
                                >
                                  {(f.options.options || []).map((opt) => (
                                    <MenuItem
                                      key={opt.i}
                                      value={opt[f.options.optionValue]}
                                    >
                                      {opt[f.options.optionDisplay]}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <TextField
                                fullWidth
                                label={f.label}
                                value={fld.value || ""}
                                onChange={fld.onChange}
                                required={f.rules?.required}
                                error={!!fs.error}
                                helperText={fs.error?.message || f.helperText}
                              />
                            )
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormInputBlock>
              </FormRow>
              <Divider />

              {/* Credentials */}
              <FormRow>
                <FormLabelBlock>
                  <SectionTitle>Credentials</SectionTitle>
                  <SectionDescription>
                    Enter AWS region, access keys, etc. securely.
                  </SectionDescription>
                </FormLabelBlock>
                <FormInputBlock>
                  <Grid container spacing={2}>
                    {defaultFields.slice(3, 7).map((f, i) => (
                      <Grid item xs={i < 2 ? 6 : 12} key={f.fieldName}>
                        <Controller
                          name={f.fieldName}
                          control={control}
                          rules={f.rules}
                          render={({ field: fld, fieldState: fs }) =>
                            f.options?.component === "select" ? (
                              <FormControl
                                fullWidth
                                error={!!fs.error}
                                required={f.rules?.required}
                              >
                                <Select
                                  value={fld.value ?? ""}
                                  onChange={fld.onChange}
                                  label={f.label}
                                  required={f.rules?.required}
                                >
                                  {(f.options.options || []).map((option) => (
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.display}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <TextField
                                fullWidth
                                label={f.label}
                                value={fld.value || ""}
                                onChange={fld.onChange}
                                required={f.rules?.required}
                                error={!!fs.error}
                                helperText={fs.error?.message || f.helperText}
                              />
                            )
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormInputBlock>
              </FormRow>
              <Divider />

              {/* Settings */}
              <FormRow>
                <FormLabelBlock>
                  <SectionTitle>Settings</SectionTitle>
                  <SectionDescription>
                    Configure chat type, tokens, history, etc.
                  </SectionDescription>
                </FormLabelBlock>
                <FormInputBlock>
                  <Grid container spacing={2}>
                    {defaultFields
                      .slice(7)
                      .filter(
                        (f) =>
                          !["file-upload", "zip-upload"].includes(
                            f.options?.component
                          )
                      )
                      .map((f, i) => {
                        const comp = f.options?.component;
                        const isSwitch =
                          comp === "switch" &&
                          f.options.options?.some((o) =>
                            ["true", "false"].includes(o.value)
                          );
                        const isTextArea = comp === "text-area";
                        return (
                          <Grid item xs={i < 2 ? 12 : 6} key={f.fieldName}>
                            <Controller
                              name={f.fieldName}
                              control={control}
                              rules={f.rules}
                              render={({ field: fld, fieldState: fs }) =>
                                isSwitch ? (
                                  <FormControlLabel
                                    sx={{
                                      ml: 1,
                                      gap: 3,
                                    }}
                                    control={
                                      <Switch
                                        size="small"
                                        checked={f.value === "true"}
                                        onChange={(
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                          f.onChange(
                                            e.target.checked ? "true" : "false"
                                          )
                                        }
                                      />
                                    }
                                    label={f.label}
                                  />
                                ) : isTextArea ? (
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    label={f.label}
                                    value={fld.value || ""}
                                    onChange={fld.onChange}
                                    required={f.rules?.required}
                                    error={!!fs.error}
                                    helperText={
                                      fs.error?.message || f.helperText
                                    }
                                  />
                                ) : (
                                  <TextField
                                    fullWidth
                                    label={f.label}
                                    value={fld.value || ""}
                                    onChange={fld.onChange}
                                    required={f.rules?.required}
                                    error={!!fs.error}
                                    helperText={
                                      fs.error?.message || f.helperText
                                    }
                                  />
                                )
                              }
                            />
                          </Grid>
                        );
                      })}
                  </Grid>
                </FormInputBlock>
              </FormRow>

              {/* Optional File Upload Under Settings */}
              {defaultFields
                .slice(7)
                .some((f) =>
                  ["file-upload", "zip-upload"].includes(f.options?.component)
                ) && (
                <>
                  <Divider />
                  <Grid container spacing={2}>
                    {defaultFields
                      .slice(7)
                      .filter((f) =>
                        ["file-upload", "zip-upload"].includes(
                          f.options?.component
                        )
                      )
                      .map((f) => (
                        <Grid item xs={12} key={f.fieldName}>
                          <SectionTitle sx={{ mt: 3 }}>{f.label}</SectionTitle>
                          <Controller
                            name={f.fieldName}
                            control={control}
                            rules={f.rules}
                            render={({ field: fld }) => (
                              <StyledFileUploadSection>
                                <FileDropzone
                                  multiple
                                  value={fld.value || f.value}
                                  onChange={(v) => fld.onChange(v)}
                                />
                              </StyledFileUploadSection>
                            )}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </>
              )}
              <Divider />

              {/* Advanced */}
              {advancedFields.length > 0 && (
                <>
                  <FormRow>
                    <SectionTitle>ADVANCED SETTINGS</SectionTitle>
                    <Box sx={{ flex: 1 }} />
                    <IconButton onClick={() => setOpenAdvanced(!openAdvanced)}>
                      {openAdvanced ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </FormRow>
                  {openAdvanced &&
                    advancedFields.map((val) =>
                      !val.hidden ? (
                        <StyledKeyValue key={val.fieldName}>
                          <Controller
                            name={val.fieldName}
                            control={control}
                            rules={val.rules}
                            render={({ field: fld }) => {
                              switch (val.options.component) {
                                case "text-field":
                                  return (
                                    <TextField
                                      fullWidth
                                      required={val.rules?.required}
                                      label={val.label}
                                      value={fld.value || ""}
                                      onChange={(e) =>
                                        fld.onChange(e.target.value)
                                      }
                                      helperText={val.helperText}
                                      inputProps={{
                                        "data-testid": `importForm-textField-${val.fieldName}`,
                                      }}
                                    />
                                  );
                                case "password":
                                  return (
                                    <TextField
                                      fullWidth
                                      type="password"
                                      required={val.rules?.required}
                                      label={val.label}
                                      value={fld.value || ""}
                                      onChange={(e) =>
                                        fld.onChange(e.target.value)
                                      }
                                      helperText={val.helperText}
                                      inputProps={{
                                        "data-testid": `importForm-textField-${val.fieldName}`,
                                      }}
                                    />
                                  );
                                case "number":
                                  return (
                                    <TextField
                                      fullWidth
                                      type="number"
                                      required={val.rules?.required}
                                      label={val.label}
                                      value={fld.value || ""}
                                      onChange={(e) =>
                                        fld.onChange(e.target.value)
                                      }
                                      helperText={val.helperText}
                                      inputProps={{
                                        "data-testid": `importForm-textField-${val.fieldName}`,
                                      }}
                                    />
                                  );
                                case "checkbox":
                                  return (
                                    <Checkbox
                                      required={val.rules?.required}
                                      label={val.label}
                                      disabled={val.disabled}
                                      checked={fld.value ? fld.value : false}
                                      onChange={(value) => fld.onChange(value)}
                                    />
                                  );
                                case "select":
                                  return (
                                    <FormControl fullWidth>
                                      <Select
                                        label={val.label}
                                        value={fld.value || ""}
                                        onChange={(e) =>
                                          fld.onChange(e.target.value)
                                        }
                                      >
                                        {val.options.options.map((opt) => (
                                          <MenuItem
                                            key={opt.i}
                                            value={opt.value}
                                          >
                                            {opt.display}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  );
                                case "zip-upload":
                                  return (
                                    <StyledFileUploadSection>
                                      <FileDropzone
                                        multiple
                                        value={fld.value || ""}
                                        onChange={(v) => fld.onChange(v)}
                                      />
                                    </StyledFileUploadSection>
                                  );
                                default:
                                  return null;
                              }
                            }}
                          />
                        </StyledKeyValue>
                      ) : null
                    )}
                </>
              )}

              <FlexEndBox>
                <Button
                  disabled={formLoading}
                  type="submit"
                  variant="contained"
                >
                  {formLoading ? (
                    <CircularProgress size="1.5em" />
                  ) : (
                    `Create ${steps[0]?.data?.toLowerCase() || ""}`
                  )}
                </Button>
              </FlexEndBox>
            </Stack>
          );
        }
        return null;
      })()}
    </form>
  );
};
