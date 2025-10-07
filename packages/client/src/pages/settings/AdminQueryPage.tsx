import {
  ArrowForward,
  Check,
  Close,
  OpenInFullSharp,
} from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Modal,
  Select,
  styled,
  Table,
  TextArea,
  TextField,
  useNotification,
} from "@semoss/ui";
import { useRootStore, useSettings } from "@/hooks";

const StyledContainer = styled("div")(() => ({
  display: "flex",
  width: "100%",
  gap: "24px",
}));

const StyledLeft = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

const StyledRight = styled("div")(() => ({
  overflow: "scroll",
  width: "100%",
  marginTop: "20px",
}));
const Styledform = styled("div")(() => ({
  width: "100%",
}));
const StyledStack = styled("div")(() => ({
  width: "100%",
  gap: "20px",
  flexDirection: "column",
  display: "flex",
  marginBottom: "20px",
}));

const Field = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  gap: "8px",
}));

const Label = styled("label")(({ theme }) => ({
  fontSize: "0.875rem",
  lineHeight: 1.4,
  color: theme.palette.text.secondary,
}));
const TableHeader = styled(Table.Head)(({ theme }) => ({
  backgroundColor: theme.palette.primary.hover,
}));
const TableHeaderCell = styled(Table.Cell)(({ theme }) => ({
  padding: "10px",
  fontWeight: 600,
  color: theme.palette.primary.main,
}));
const StyledBox = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
});
const CheckIcon = styled(Check)(({ theme }) => ({
  color: theme.palette.success.main,
}));
const CloseIcon = styled(Close)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const StyledSelect = styled(Select)(() => ({
  width: "100%",
}));

const StyledTextArea = styled(TextArea)({
  width: "100%",
  overflow: "none",
});
const StyledIconButton = styled(IconButton)({
  padding: 0,
  color: "text.secondary",
});
const StyledCloseIconButton = styled(IconButton)({
  position: "absolute",
  right: "8px",
  top: "15px",
});
const ModalTitle = styled(Modal.Title)({
  m: 0,
  p: 2,
});
const ModalActions = styled(Modal.Actions)({
  p: 2,
});
const StyledTableCell = styled(Table.Cell)<{ $isBoolean?: boolean }>(
  ({ $isBoolean }) => ({
    padding: "10px",
    textAlign: $isBoolean ? "center" : "left",
  })
);
const StyledButton = styled(Button)({
  marginTop: "16px",
});

const DATABASE_OPTIONS = [
  "LocalMasterDatabase",
  "security",
  "scheduler",
  "themes",
  "UserTrackingDatabase",
];

interface TypeDbQuery {
  SELECTED_DATABASE: string;
  QUERY: string;
  ROWS: number;
}

export const AdminQueryPage = () => {
  const { monolithStore } = useRootStore();
  const { adminMode } = useSettings();
  const notification = useNotification();
  const [output, setOutput] = useState<{
    type: string;
    value;
  }>({
    type: "",
    value: "",
  });
  const [showRowsField, setShowRowsField] = useState(false);
  const { control, watch, setValue, handleSubmit } = useForm<{
    SELECTED_DATABASE: string;
    QUERY: string;
    ROWS: number;
  }>({
    defaultValues: {
      SELECTED_DATABASE: "",
      QUERY: "",
      ROWS: 100,
    },
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openModal = useCallback((value: string) => {
    setDraft(value ?? "");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  // ⚠️ handleDone needs `field.onChange`, so we’ll pass it down
  const handleDone = useCallback(
    (onChange: (v: string) => void) => {
      onChange(draft);
      setOpen(false);
    },
    [draft]
  );
  const query = watch("QUERY");
  const selectedDatabase = watch("SELECTED_DATABASE");

  const disableButton = query && selectedDatabase ? true : false;

  const verifySelectQuery = useCallback(() => {
    if (query?.toUpperCase()?.startsWith("SELECT")) {
      setShowRowsField(true);
    } else {
      if (showRowsField) {
        setShowRowsField(false);
        setValue("ROWS", 0);
      }
    }
  }, [query, showRowsField, setValue]);

  useEffect(() => {
    verifySelectQuery();
  }, [verifySelectQuery]);

  if (!adminMode) {
    return <Navigate to={"/settings"} />;
  }

  /**
   * @name submitQuery
   * @desc make runQuery API call based on submitted fields
   */
  const submitQuery = handleSubmit((data: TypeDbQuery) => {
    let pixelString = `META | AdminDatabase("${data.SELECTED_DATABASE}") | Query("<encode>${data.QUERY}</encode>")`;

    if (showRowsField) {
      pixelString += `| Collect(${data.ROWS});`;
    } else {
      // No collect
      pixelString += "| AdminExecQuery();";
    }
    monolithStore
      .runQuery(pixelString)
      .then((response) => {
        let output: string | { data: { headers: string[]; values } };
        let type: string = response.pixelReturn[0].operationType[0];

        output = response.pixelReturn[0].output;
        type = response.pixelReturn[0].operationType[0];

        if (type.indexOf("ERROR") > -1) {
          setOutput({
            type: "error",
            value: output,
          });
          notification.add({
            color: "error",
            message:
              typeof output === "string" ? output : JSON.stringify(output),
          });

          return;
        }

        // if we have a select query returning data
        else if (output instanceof Object) {
          setOutput({
            type: "table",
            value: {
              headers: output.data.headers,
              values: output.data.values,
            },
          });
        }

        // if we have a non-select query
        else {
          setOutput({
            type: "success",
            value: "",
          });
        }

        notification.add({
          color: "success",
          message: "Successfully submitted query",
        });
      })
      .catch((error) => {
        notification.add({
          color: "error",
          message: error,
        });
      });
  });
  const toBool = (v: unknown): boolean | null => {
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    return null;
  };

  const isBooleanColumn = (colIndex: number): boolean => {
    const response = output?.value?.headerInfo?.[colIndex];
    if (response && typeof response.dataType === "string") {
      const dt = response.dataType.toUpperCase();
      if (dt === "BOOLEAN" || dt === "BOOL") return true;
    }
    return false;
  };

  const renderCell = (val, colIndex: number) => {
    const isBool = isBooleanColumn(colIndex);
    const normalized = toBool(val);

    if (isBool || normalized !== null) {
      const b = normalized;
      return (
        <StyledBox>
          {b === true && <CheckIcon fontSize="small" />}
          {b === false && <CloseIcon fontSize="small" />}
        </StyledBox>
      );
    }
    return String(val ?? "");
  };

  /**
   * @name displayQueryOutput
   * @desc return alert or table based on the queryOutputType
   * @returns JSX.Element
   */
  const displayQueryOutput = (): JSX.Element => {
    if (output.type === "success") {
      return <Alert color={"success"}>Successful query!</Alert>;
    } else if (output.type === "error") {
      return <Alert color={"error"}>{output.value}</Alert>;
    } else if (output.type === "table") {
      const headers = output.value.headers;
      const rows = output.value.values;
      return (
        <Table>
          <TableHeader>
            <Table.Row>
              {headers.map((header: string, index: number) => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
            </Table.Row>
          </TableHeader>
          <Table.Body>
            {rows.map((row, rIdx: number) => (
              <Table.Row key={row}>
                {row.map((col, cIdx) => (
                  <StyledTableCell key={col}>
                    {renderCell(col, cIdx)}
                  </StyledTableCell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      );
    }

    return null;
  };

  return (
    <StyledContainer>
      <StyledLeft>
        <Styledform>
          <StyledStack>
            <Controller
              name="SELECTED_DATABASE"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Field>
                  <Label htmlFor="db-select">Database</Label>
                  <StyledSelect
                    size="small"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {DATABASE_OPTIONS.map((option, i) => (
                      <Select.Item value={option} key={option}>
                        {option}
                      </Select.Item>
                    ))}
                  </StyledSelect>
                </Field>
              )}
            />
          </StyledStack>

          <StyledStack>
            <Controller
              name="ROWS"
              control={control}
              rules={{ min: 1 }}
              render={({ field }) => (
                <Field>
                  <Label htmlFor="rows-input">Max # Rows to Collect</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    type="number"
                    placeholder="100"
                  />
                </Field>
              )}
            />
          </StyledStack>
          <Controller
            name={"QUERY"}
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              return (
                <>
                  <Field>
                    <Label htmlFor="query-textarea">
                      Enter query to run on database
                    </Label>
                    <StyledTextArea
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      minRows={4}
                      maxRows={4}
                      placeholder="SELECT * FROM engine"
                      InputProps={{
                        endAdornment: (
                          <StyledIconButton
                            size="small"
                            onClick={() => openModal(field.value ?? "")}
                          >
                            <OpenInFullSharp />
                          </StyledIconButton>
                        ),
                        sx: {
                          alignItems: "flex-start",
                        },
                      }}
                    />
                  </Field>
                  <Modal
                    open={open}
                    onClose={closeModal}
                    fullWidth
                    maxWidth="md"
                    scroll="paper"
                  >
                    <ModalTitle>
                      Enter query to run on database
                      <StyledCloseIconButton
                        onClick={closeModal}
                        aria-label="close"
                        size="small"
                      >
                        <Close fontSize="small" />
                      </StyledCloseIconButton>
                    </ModalTitle>

                    <Modal.Content>
                      <StyledTextArea
                        minRows={10}
                        maxRows={16}
                        value={draft}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraft(e.target.value)
                        }
                      />
                    </Modal.Content>

                    <ModalActions>
                      <Button onClick={closeModal}>Cancel</Button>
                      <Button
                        variant="contained"
                        onClick={() => handleDone(field.onChange)}
                      >
                        Done
                      </Button>
                    </ModalActions>
                  </Modal>
                </>
              );
            }}
          />
          <StyledButton
            size="large"
            variant={"contained"}
            onClick={() => submitQuery()}
            disabled={!disableButton}
            data-testid={"adminQueryPage-run-btn"}
            endIcon={<ArrowForward />}
          >
            Run Query
          </StyledButton>
          <StyledRight>
            {!output.type
              ? "Execute a query to display the results here."
              : displayQueryOutput()}
          </StyledRight>
        </Styledform>
      </StyledLeft>
    </StyledContainer>
  );
};
